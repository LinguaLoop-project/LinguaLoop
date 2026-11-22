import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import { parseIntIn, planMargin, useCreditConfig } from "@/features/credit";
import { formatNumber, isRetryable, type AdminApiError } from "@/features/user";
import { toast } from "@/stores/toastStore";
import { useCreatePlan, useUpdatePlan } from "../../hooks/useAdminPlans";
import type { ProPlan, ProPlanInput } from "../../services/adminPlanService";

const TITLE_ID = "plan-form-title";
const NAME_MAX = 50;

type Field = "name" | "months" | "priceVnd" | "creditsPerMonth";
type Values = Record<Field, string>;

function toValues(plan: ProPlan | null): Values {
  return plan
    ? { name: plan.name, months: String(plan.months), priceVnd: String(plan.priceVnd), creditsPerMonth: String(plan.creditsPerMonth) }
    : { name: "", months: "", priceVnd: "", creditsPerMonth: "" };
}

/** Khoảng hợp lệ theo BR-GA-07; trả về giá trị đã đổi kiểu hoặc lỗi theo từng ô. */
function validate(values: Values): { input: ProPlanInput | null; errors: Partial<Record<Field, string>> } {
  const errors: Partial<Record<Field, string>> = {};
  const name = values.name.trim();
  if (name.length === 0 || name.length > NAME_MAX) errors.name = "form.errors.name";
  const months = parseIntIn(values.months, 1, 36);
  if (months === null) errors.months = "form.errors.months";
  const priceVnd = parseIntIn(values.priceVnd, 0, 100_000_000);
  if (priceVnd === null) errors.priceVnd = "form.errors.price";
  const creditsPerMonth = parseIntIn(values.creditsPerMonth, 0, 1_000_000);
  if (creditsPerMonth === null) errors.creditsPerMonth = "form.errors.credits";
  if (months === null || priceVnd === null || creditsPerMonth === null || errors.name) return { input: null, errors };
  return { input: { name, months, priceVnd, creditsPerMonth }, errors };
}

export interface PlanFormDialogProps {
  /** null = thêm gói mới (UC-GA-04); có giá trị = sửa gói (UC-GA-05). */
  plan: ProPlan | null;
  onClose: () => void;
  /** Đọc lại gói mới nhất khi người khác vừa sửa (UC-GA-05 7a). */
  reloadPlan: (id: string) => Promise<ProPlan | undefined>;
}

/**
 * Biểu mẫu thêm hoặc sửa gói Pro, kèm biên khi dùng hết credit tính theo cấu hình credit hiện hành (BR-GA-05). Biên thấp
 * hơn biên tối thiểu chỉ cảnh báo, vẫn cho lưu; gói 0 đồng nêu chi phí tối đa mỗi học viên mỗi tháng.
 */
export default function PlanFormDialog({ plan: initial, onClose, reloadPlan }: Readonly<PlanFormDialogProps>) {
  const { t, i18n } = useTranslation("creditAdmin");
  const config = useCreditConfig();
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const [plan, setPlan] = useState(initial);
  const [values, setValues] = useState<Values>(() => toValues(initial));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState<{ variant: "info" | "danger"; text: string } | null>(null);
  const pending = create.isPending || update.isPending;

  const months = parseIntIn(values.months, 1, 36);
  const price = parseIntIn(values.priceVnd, 0, 100_000_000);
  const credits = parseIntIn(values.creditsPerMonth, 0, 1_000_000);
  const margin =
    config.data && months !== null && price !== null && credits !== null
      ? planMargin({ months, priceVnd: price, creditsPerMonth: credits }, config.data)
      : null;

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = () => {
    setNotice(null);
    const result = validate(values);
    setErrors(result.errors);
    if (!result.input) return;
    const input = result.input;
    if (plan && input.name === plan.name && input.months === plan.months && input.priceVnd === plan.priceVnd
      && input.creditsPerMonth === plan.creditsPerMonth) {
      setNotice({ variant: "info", text: t("form.unchanged") });
      return;
    }
    const onError = (raw: unknown) => {
      const err = raw as AdminApiError;
      if (isRetryable(err)) {
        setNotice({ variant: "danger", text: t("form.saveFailed") });
        return;
      }
      if (err.code === "PRO_PLAN_NAME_TAKEN") {
        setErrors({ name: "errors.PRO_PLAN_NAME_TAKEN" });
        return;
      }
      if (err.code === "PRO_PLAN_UNCHANGED") {
        setNotice({ variant: "info", text: t("form.unchanged") });
        return;
      }
      if (err.code === "PRO_PLAN_STALE" && plan) {
        // Người khác vừa sửa (7a): hiện thông tin mới nhất của gói để sửa lại
        void reloadPlan(plan.id).then((fresh) => {
          if (fresh) {
            setPlan(fresh);
            setValues(toValues(fresh));
          }
        });
        setNotice({ variant: "danger", text: t("errors.PRO_PLAN_STALE") });
        return;
      }
      const fieldErrors: Partial<Record<Field, string>> = {};
      err.fieldErrors.forEach((f) => {
        if (f.field in values) fieldErrors[f.field as Field] = "errors.invalid";
      });
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) setNotice({ variant: "danger", text: t("form.saveFailed") });
    };
    const onSuccess = () => {
      toast(t(plan ? "form.updated" : "form.created", { name: input.name }), { icon: "circle-check" });
      onClose();
    };
    if (plan) update.mutate({ id: plan.id, version: plan.version, input }, { onSuccess, onError });
    else create.mutate(input, { onSuccess, onError });
  };

  const input = (field: Field, inputMode: "text" | "numeric") => (
    <label className="flex flex-col gap-1 text-sm text-text">
      {t(`form.fields.${field}`)}
      <input
        value={values[field]}
        inputMode={inputMode}
        maxLength={field === "name" ? NAME_MAX + 20 : undefined}
        onChange={(e) => set(field, e.target.value)}
        aria-invalid={errors[field] ? true : undefined}
        className={`h-10 rounded-md border bg-surface px-3 text-text ${errors[field] ? "border-danger" : "border-border"}`}
      />
      {errors[field] && <span className="text-danger">{t(errors[field])}</span>}
    </label>
  );

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {plan ? t("form.editTitle", { name: plan.name }) : t("form.addTitle")}
        </h2>
        {notice && <FormAlert variant={notice.variant}>{notice.text}</FormAlert>}
        {plan && <p className="-mt-2 text-sm text-text-muted">{t("form.purchases", { count: plan.purchases })}</p>}
        {input("name", "text")}
        <div className="grid gap-3 sm:grid-cols-3">
          {input("months", "numeric")}
          {input("priceVnd", "numeric")}
          {input("creditsPerMonth", "numeric")}
        </div>

        {margin && config.data && (
          <div className="rounded-md border border-border bg-surface-hover p-3 text-sm">
            {margin.kind === "free" ? (
              <p className="text-text">
                {t("margin.free", { cost: formatNumber(margin.maxCostVnd, i18n.language) })}
              </p>
            ) : (
              <>
                <p className="text-text">
                  {t("margin.value")}{" "}
                  <b className={margin.low ? "text-warning" : "text-success"}>{formatNumber(margin.pct, i18n.language)}%</b>
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {t("margin.formula", {
                    credits: formatNumber(credits ?? 0, i18n.language),
                    value: formatNumber(config.data.creditValueVnd, i18n.language),
                    price: formatNumber(price ?? 0, i18n.language),
                    months: months ?? 1,
                    fee: formatNumber(config.data.gatewayFeePct, i18n.language),
                  })}
                </p>
              </>
            )}
          </div>
        )}
        {margin?.kind === "margin" && margin.low && config.data && (
          <FormAlert variant="warning">
            {t("margin.low", { min: formatNumber(config.data.marginPct, i18n.language) })}
          </FormAlert>
        )}
        {config.isError && <p className="text-xs text-text-muted">{t("margin.unavailable")}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button type="button" isLoading={pending} onClick={submit}>
            {t("form.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
