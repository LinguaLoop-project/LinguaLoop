import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { toApiError } from "@/features/auth/errors";
import { formatVnd } from "@/features/user";
import { useCheckout, useRefreshPlan, useSalePlans } from "../hooks/usePayment";
import { expectedEnd, savingsPercent } from "../payment";
import type { OrderKind } from "../types";
import { formatDay } from "./format";

/** Mã lỗi có câu riêng khi tạo đơn; mã khác dùng câu chung. */
const KNOWN_ERRORS = ["PRO_ALREADY_ACTIVE", "PRO_NOT_ACTIVE", "PRO_PLAN_NOT_ON_SALE", "PAYMENT_UNAVAILABLE", "NETWORK_ERROR"];

interface PlanPickerProps {
  kind: OrderKind;
  /** Ngày hết hạn của gói Pro hiện tại, để tính ngày hết hạn mới khi gia hạn. */
  currentEnd: string | null;
  onClose: () => void;
}

/**
 * Chọn kỳ hạn gói Pro rồi chuyển sang VNPAY (UC-PR-02 bước 3 đến 5, UC-PR-04 bước 3 đến 5). Đóng mà không thanh toán thì
 * không có đơn nào được tạo (AC-PR-08, AC-PR-20).
 */
export default function PlanPicker({ kind, currentEnd, onClose }: PlanPickerProps) {
  const { t, i18n } = useTranslation("subscription");
  const navigate = useNavigate();
  const plans = useSalePlans();
  const checkout = useCheckout();
  const refresh = useRefreshPlan();
  const [chosen, setChosen] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const list = plans.data ?? [];
  const selected = list.find((p) => p.id === chosen) ?? list[0];

  const submit = () => {
    if (!selected) return;
    checkout.mutate(
      { planId: selected.id, kind },
      {
        onSuccess: ({ order, paymentUrl }) => {
          if (paymentUrl) {
            setRedirecting(true);
            window.location.assign(paymentUrl);
            return;
          }
          // Gói 0 đồng đã được ghi nhận ngay
          void refresh();
          navigate(`/payment/vnpay-return?order=${order.id}`);
        },
        onError: (err) => {
          const code = toApiError(err).code;
          // Gói vừa đổi ở tab khác: đọc lại để trang hiện đúng nút nâng cấp hoặc gia hạn (AC-PR-09)
          if (code === "PRO_ALREADY_ACTIVE" || code === "PRO_NOT_ACTIVE") void refresh();
        },
      },
    );
  };

  const errorCode = checkout.error ? toApiError(checkout.error).code : null;

  return (
    <section
      aria-labelledby="plan-picker-title"
      className="rounded-lg border border-primary bg-surface p-5 shadow-[var(--shadow-card)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id="plan-picker-title" className="font-display text-2xl font-bold">
          {t(kind === "renew" ? "picker.titleRenew" : "picker.titleUpgrade")}
        </h2>
        <Button type="button" variant="ghost" size="sm" iconOnly aria-label={t("picker.close")} onClick={onClose}>
          <Icon name="x" />
        </Button>
      </div>

      {kind === "renew" && currentEnd && (
        <p className="mb-4 text-sm text-text-muted">{t("picker.currentEnd", { date: formatDay(currentEnd, i18n.language) })}</p>
      )}

      {plans.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : plans.isError ? (
        <div className="flex flex-col items-start gap-3">
          <FormAlert variant="danger">{t("loadFailed")}</FormAlert>
          <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={() => void plans.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : list.length === 0 ? (
        <p className="text-text-muted">{t("picker.empty")}</p>
      ) : (
        <>
          <div role="radiogroup" aria-labelledby="plan-picker-title" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((plan) => {
              const active = plan.id === selected?.id;
              const save = savingsPercent(plan, list);
              return (
                <button
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setChosen(plan.id)}
                  className={`flex cursor-pointer flex-col gap-1.5 rounded-lg border-2 bg-surface p-4 text-left transition-colors ${
                    active ? "border-primary bg-primary-soft" : "border-border hover:border-border-strong"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <b className="font-display text-lg">{plan.name}</b>
                    {save !== null && <Badge variant="success">{t("picker.save", { percent: save })}</Badge>}
                  </span>
                  <span className="font-display text-2xl font-bold tabular-nums">{formatVnd(plan.priceVnd, i18n.language)}</span>
                  <span className="text-sm text-text-muted">{t("picker.months", { count: plan.months })}</span>
                  <span className="text-sm text-text-muted">{t("picker.perMonth", { credits: plan.creditsPerMonth })}</span>
                  <span className="text-xs text-text-muted">
                    {t("picker.endsOn", {
                      date: formatDay(expectedEnd(kind, plan.months, new Date(), currentEnd).toISOString(), i18n.language),
                    })}
                  </span>
                </button>
              );
            })}
          </div>

          {errorCode && (
            <FormAlert variant="danger" className="mt-4">
              {t(`errors.${KNOWN_ERRORS.includes(errorCode) ? errorCode : "default"}`)}
            </FormAlert>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <p className="max-w-prose text-sm text-text-muted">{t("picker.note")}</p>
            <div className="flex items-center gap-4">
              {selected && (
                <span className="text-right">
                  <span className="block text-xs text-text-muted">{t("picker.total")}</span>
                  <b className="font-display text-xl tabular-nums">{formatVnd(selected.priceVnd, i18n.language)}</b>
                </span>
              )}
              <Button
                type="button"
                onClick={submit}
                disabled={!selected || checkout.isPending || redirecting}
                leftIcon={<Icon name={errorCode ? "rotate-cw" : "credit-card"} />}
              >
                {redirecting ? t("picker.redirecting") : errorCode ? t("retry") : t("picker.continue")}
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
