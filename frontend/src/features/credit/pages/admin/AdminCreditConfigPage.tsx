import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { formatDateTime, formatNumber, isRetryable, type AdminApiError } from "@/features/user";
import { toast } from "@/stores/toastStore";
import { useCreditConfig, useUpdateCreditConfig } from "../../hooks";
import { parseIntIn, parsePercent } from "../../margin";
import type { CreditConfig, CreditFeatureRow, UpdateCreditConfigInput } from "../../types";

const SUMMARY_ID = "credit-config-summary";
const MONEY_MAX = 100_000_000;

type FeatureField = "creditsPerUse" | "inputPriceVnd" | "outputPriceVnd" | "fixedCostVnd";
const FEATURE_FIELDS: FeatureField[] = ["creditsPerUse", "inputPriceVnd", "outputPriceVnd", "fixedCostVnd"];

/** Giá trị đang nhập, giữ dạng chuỗi để báo lỗi đúng chỗ khi người dùng nhập sai (UC-GA-02 5a). */
interface Draft {
  creditValueVnd: string;
  gatewayFeePct: string;
  marginPct: string;
  trialCredits: string;
  features: Record<string, Record<FeatureField, string>>;
}

type Errors = Record<string, string>;

interface Change {
  key: string;
  label: string;
  from: string;
  to: string;
}

function toDraft(config: CreditConfig): Draft {
  return {
    creditValueVnd: String(config.creditValueVnd),
    gatewayFeePct: String(config.gatewayFeePct),
    marginPct: String(config.marginPct),
    trialCredits: String(config.trialCredits),
    features: Object.fromEntries(
      config.features.map((row) => [
        row.feature,
        Object.fromEntries(FEATURE_FIELDS.map((f) => [f, String(row[f])])) as Record<FeatureField, string>,
      ]),
    ),
  };
}

/** Khoảng hợp lệ theo BR-GA-02, 03, 04; trả về giá trị đã đổi kiểu hoặc lỗi theo từng ô. */
function validate(draft: Draft, config: CreditConfig): { input: UpdateCreditConfigInput | null; errors: Errors } {
  const errors: Errors = {};
  const int = (key: string, raw: string, min: number, max: number, message: string) => {
    const value = parseIntIn(raw, min, max);
    if (value === null) errors[key] = message;
    return value ?? 0;
  };
  const pct = (key: string, raw: string) => {
    const value = parsePercent(raw);
    if (value === null) errors[key] = "errors.percent";
    return value ?? 0;
  };
  const creditValueVnd = int("creditValueVnd", draft.creditValueVnd, 1, 1000, "errors.int1to1000");
  const gatewayFeePct = pct("gatewayFeePct", draft.gatewayFeePct);
  const marginPct = pct("marginPct", draft.marginPct);
  const trialCredits = int("trialCredits", draft.trialCredits, 0, 10_000, "errors.int0to10000");
  const features: CreditFeatureRow[] = config.features.map((row) => {
    const raw = draft.features[row.feature];
    const key = (f: FeatureField) => `${row.feature}.${f}`;
    return {
      feature: row.feature,
      creditsPerUse: int(key("creditsPerUse"), raw.creditsPerUse, 1, 1000, "errors.int1to1000"),
      inputPriceVnd: int(key("inputPriceVnd"), raw.inputPriceVnd, 0, MONEY_MAX, "errors.money"),
      outputPriceVnd: int(key("outputPriceVnd"), raw.outputPriceVnd, 0, MONEY_MAX, "errors.money"),
      fixedCostVnd: int(key("fixedCostVnd"), raw.fixedCostVnd, 0, MONEY_MAX, "errors.money"),
    };
  });
  if (!errors.gatewayFeePct && !errors.marginPct && gatewayFeePct + marginPct >= 100) {
    errors.marginPct = "errors.CREDIT_CONFIG_FEE_MARGIN_TOO_HIGH";
  }
  if (Object.keys(errors).length > 0) return { input: null, errors };
  return {
    input: { version: config.version, creditValueVnd, gatewayFeePct, marginPct, trialCredits, features },
    errors,
  };
}

/** Khoá lỗi của server ("features[2].creditsPerUse") về khoá ô của màn hình ("lesson_chat.creditsPerUse"). */
function serverFieldKey(field: string, config: CreditConfig): string {
  const match = /^features\[(\d+)]\.(\w+)$/.exec(field);
  if (!match) return field;
  const row = config.features[Number(match[1])];
  return row ? `${row.feature}.${match[2]}` : field;
}

/**
 * Cấu hình credit (UC-GA-01, UC-GA-02): thông số quy đổi, credit miễn phí và bảng dịch vụ tính credit. Sửa thì hiện
 * tóm tắt thay đổi và yêu cầu xác nhận; người khác vừa sửa thì nạp lại cấu hình mới nhất.
 */
export default function AdminCreditConfigPage() {
  const { t, i18n } = useTranslation("creditAdmin");
  const query = useCreditConfig();
  const update = useUpdateCreditConfig();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<{ input: UpdateCreditConfigInput; changes: Change[] } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  if (query.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }
  if (query.isError || !query.data) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col items-start gap-3 p-6">
        <FormAlert variant="danger">{t("loadFailed")}</FormAlert>
        <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={() => void query.refetch()}>
          {t("reload")}
        </Button>
      </main>
    );
  }

  const config = query.data;
  const editing = draft !== null;
  const num = (value: number) => formatNumber(value, i18n.language);
  const featureName = (feature: string) => t(`features.${feature}.name`);

  const startEdit = () => {
    setDraft(toDraft(config));
    setErrors({});
    setNotice(null);
  };
  const cancel = () => {
    setDraft(null);
    setErrors({});
    setNotice(null);
  };

  const describe = (input: UpdateCreditConfigInput): Change[] => {
    const changes: Change[] = [];
    const add = (key: string, label: string, from: string, to: string) => {
      if (from !== to) changes.push({ key, label, from, to });
    };
    add("creditValueVnd", t("fields.creditValueVnd"), `${num(config.creditValueVnd)} đ`, `${num(input.creditValueVnd)} đ`);
    add("gatewayFeePct", t("fields.gatewayFeePct"), `${num(config.gatewayFeePct)}%`, `${num(input.gatewayFeePct)}%`);
    add("marginPct", t("fields.marginPct"), `${num(config.marginPct)}%`, `${num(input.marginPct)}%`);
    add("trialCredits", t("fields.trialCredits"), num(config.trialCredits), num(input.trialCredits));
    config.features.forEach((row, i) => {
      const next = input.features[i];
      for (const f of FEATURE_FIELDS) {
        add(`${row.feature}.${f}`, `${featureName(row.feature)} · ${t(`columns.${f}`)}`, num(row[f]), num(next[f]));
      }
    });
    return changes;
  };

  const save = () => {
    if (!draft) return;
    setNotice(null);
    const result = validate(draft, config);
    setErrors(result.errors);
    if (!result.input) return;
    const changes = describe(result.input);
    if (changes.length === 0) {
      setNotice(t("unchanged"));
      return;
    }
    setFailure(null);
    setPending({ input: result.input, changes });
  };

  const confirm = () => {
    if (!pending) return;
    setFailure(null);
    update.mutate(pending.input, {
      onSuccess: () => {
        toast(t("saved"), { icon: "circle-check" });
        setPending(null);
        setDraft(null);
      },
      onError: (raw) => {
        const err = raw as unknown as AdminApiError;
        if (isRetryable(err)) {
          setFailure(t("saveFailed"));
          return;
        }
        setPending(null);
        if (err.code === "CREDIT_CONFIG_STALE") {
          // Người khác vừa sửa (8b): nạp cấu hình mới nhất và mở lại chế độ sửa từ đó
          toast(t("errors.CREDIT_CONFIG_STALE"), { icon: "circle-alert" });
          void query.refetch().then((fresh) => {
            if (fresh.data) setDraft(toDraft(fresh.data));
          });
          return;
        }
        if (err.code === "CREDIT_CONFIG_UNCHANGED") {
          setNotice(t("unchanged"));
          return;
        }
        if (err.code === "CREDIT_CONFIG_FEE_MARGIN_TOO_HIGH") {
          setErrors({ marginPct: "errors.CREDIT_CONFIG_FEE_MARGIN_TOO_HIGH" });
          return;
        }
        const fieldErrors = Object.fromEntries(
          err.fieldErrors.map((f) => [serverFieldKey(f.field, config), "errors.invalid"]),
        );
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) setNotice(t("saveFailed"));
      },
    });
  };

  const setField = (key: keyof Omit<Draft, "features">, value: string) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  const setFeature = (feature: string, field: FeatureField, value: string) =>
    setDraft((d) => (d ? { ...d, features: { ...d.features, [feature]: { ...d.features[feature], [field]: value } } } : d));

  const field = (key: keyof Omit<Draft, "features">, value: number, suffix: string) => (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={`cfg-${key}`} className="text-text-muted">
        {t(`fields.${key}`)}
      </label>
      {editing ? (
        <input
          id={`cfg-${key}`}
          inputMode="decimal"
          value={draft[key]}
          onChange={(e) => setField(key, e.target.value)}
          aria-invalid={errors[key] ? true : undefined}
          className={`h-10 w-40 rounded-md border bg-surface px-3 text-text ${errors[key] ? "border-danger" : "border-border"}`}
        />
      ) : (
        <span id={`cfg-${key}`} className="text-lg font-semibold text-text">
          {num(value)}
          {suffix}
        </span>
      )}
      {errors[key] && <span className="text-danger">{t(errors[key])}</span>}
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {config.updatedBy
              ? t("lastEdit", {
                  name: config.updatedBy.displayName ?? t("unknownAdmin"),
                  at: formatDateTime(config.updatedAt, i18n.language),
                })
              : t("neverEdited")}
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={cancel}>
              {t("cancel")}
            </Button>
            <Button type="button" leftIcon={<Icon name="save" />} onClick={save}>
              {t("save")}
            </Button>
          </div>
        ) : (
          <Button type="button" leftIcon={<Icon name="pencil" />} onClick={startEdit}>
            {t("edit")}
          </Button>
        )}
      </header>

      {notice && <FormAlert variant="info">{notice}</FormAlert>}

      <section className="grid gap-5 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-text">{t("sections.conversion")}</h2>
          {field("creditValueVnd", config.creditValueVnd, " đ")}
          {field("gatewayFeePct", config.gatewayFeePct, "%")}
          {field("marginPct", config.marginPct, "%")}
          <p className="text-xs text-text-subtle">{t("hints.margin")}</p>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-text">{t("sections.free")}</h2>
          {field("trialCredits", config.trialCredits, "")}
          <p className="text-xs text-text-subtle">{t("hints.free")}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-bold text-text">{t("sections.features")}</h2>
        <p className="text-xs text-text-subtle">{t("hints.features")}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="py-2 pr-3 font-semibold">{t("columns.feature")}</th>
                {FEATURE_FIELDS.map((f) => (
                  <th key={f} className="px-2 py-2 text-right font-semibold">
                    {t(`columns.${f}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.features.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-0 align-top">
                  <td className="py-2 pr-3">
                    <span className="block font-semibold text-text">{featureName(row.feature)}</span>
                    <span className="text-xs text-text-muted">{t(`features.${row.feature}.who`)}</span>
                  </td>
                  {FEATURE_FIELDS.map((f) => {
                    const key = `${row.feature}.${f}`;
                    return (
                      <td key={f} className="px-2 py-2 text-right">
                        {editing ? (
                          <>
                            <input
                              aria-label={`${featureName(row.feature)} · ${t(`columns.${f}`)}`}
                              inputMode="numeric"
                              value={draft.features[row.feature][f]}
                              onChange={(e) => setFeature(row.feature, f, e.target.value)}
                              aria-invalid={errors[key] ? true : undefined}
                              className={`h-9 w-28 rounded-md border bg-surface px-2 text-right text-text ${
                                errors[key] ? "border-danger" : "border-border"
                              }`}
                            />
                            {errors[key] && <span className="mt-1 block text-xs text-danger">{t(errors[key])}</span>}
                          </>
                        ) : f === "creditsPerUse" ? (
                          <span className="font-semibold text-text">
                            {t("perUnit", { count: row.creditsPerUse, unit: t(`features.${row.feature}.unit`) })}
                          </span>
                        ) : (
                          <span className="text-text">{num(row[f])}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pending && (
        <Dialog open onClose={() => setPending(null)} labelledBy={SUMMARY_ID} wide>
          <div className="flex flex-col gap-4">
            <h2 id={SUMMARY_ID} className="text-lg font-bold text-text">
              {t("summary.title")}
            </h2>
            {failure && <FormAlert variant="danger">{failure}</FormAlert>}
            <ul className="flex flex-col gap-1 text-sm text-text">
              {pending.changes.map((c) => (
                <li key={c.key}>
                  <span className="font-semibold">{c.label}:</span> {t("summary.change", { from: c.from, to: c.to })}
                </li>
              ))}
            </ul>
            <FormAlert variant="warning">{t("summary.warning")}</FormAlert>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPending(null)} disabled={update.isPending}>
                {t("summary.back")}
              </Button>
              <Button type="button" isLoading={update.isPending} onClick={confirm}>
                {t("summary.confirm")}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </main>
  );
}
