import { useEffect, useState } from "react";
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

  // Bấm Quay lại từ trang VNPAY, trình duyệt có thể khôi phục trang từ bộ nhớ đệm: mở lại nút thanh toán
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

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
      className="rounded-2xl border border-primary/50 bg-surface p-6 shadow-[var(--shadow-card)]"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
            <Icon name="crown" className="text-xl" />
          </span>
          <div>
            <h2 id="plan-picker-title" className="font-display text-2xl font-bold leading-tight">
              {t(kind === "renew" ? "picker.titleRenew" : "picker.titleUpgrade")}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {kind === "renew" && currentEnd
                ? t("picker.currentEnd", { date: formatDay(currentEnd, i18n.language) })
                : t(kind === "renew" ? "picker.subtitleRenew" : "picker.subtitleUpgrade")}
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" iconOnly aria-label={t("picker.close")} onClick={onClose}>
          <Icon name="x" />
        </Button>
      </div>

      {plans.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : plans.isError ? (
        <div className="flex flex-col items-start gap-3">
          <FormAlert variant="danger">{t("loadFailed")}</FormAlert>
          <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={() => void plans.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-border bg-bg-elevated/60 p-5 text-sm text-text-muted">{t("picker.empty")}</p>
      ) : (
        <>
          <div role="radiogroup" aria-labelledby="plan-picker-title" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((plan) => {
              const active = plan.id === selected?.id;
              const save = savingsPercent(plan, list);
              const perMonthPrice = plan.months > 1 ? Math.round(plan.priceVnd / plan.months) : null;
              return (
                <button
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setChosen(plan.id)}
                  className={`group relative flex cursor-pointer flex-col justify-between gap-4 rounded-xl border-2 p-5 text-left transition-all duration-150 ${
                    active
                      ? "border-primary bg-primary-soft/55 shadow-[0_12px_28px_-14px_rgba(124,92,255,0.55)]"
                      : "border-border bg-bg-elevated/45 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-hover/50"
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            active
                              ? "border-primary bg-primary text-white"
                              : "border-border-strong bg-surface group-hover:border-primary/60"
                          }`}
                        >
                          {active && <Icon name="check" className="text-[12px]" strokeWidth={3} />}
                        </span>
                        <b className="font-display text-lg font-bold text-text">{plan.name}</b>
                      </div>
                      {save !== null && <Badge variant="success">{t("picker.save", { percent: save })}</Badge>}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-display text-3xl font-bold tracking-tight tabular-nums text-text">
                        {formatVnd(plan.priceVnd, i18n.language)}
                      </span>
                      {perMonthPrice !== null && (
                        <span className="text-xs font-medium tabular-nums text-primary-text">
                          {t("picker.pricePerMonth", { price: formatVnd(perMonthPrice, i18n.language) })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border/80 pt-3 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-2">
                      <Icon name="calendar" className="text-sm text-primary-text" />
                      <span>{t("picker.months", { count: plan.months })}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 font-medium text-text">
                      <Icon name="zap" fill className="text-sm text-warning" />
                      <span>{t("picker.perMonth", { credits: plan.creditsPerMonth })}</span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Icon name="clock" className="text-sm text-text-muted" />
                      <span>
                        {t("picker.endsOn", {
                          date: formatDay(expectedEnd(kind, plan.months, new Date(), currentEnd).toISOString(), i18n.language),
                        })}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {errorCode && (
            <FormAlert variant="danger" className="mt-4">
              {t(`errors.${KNOWN_ERRORS.includes(errorCode) ? errorCode : "default"}`)}
            </FormAlert>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-bg-elevated/75 px-4 py-3.5">
            <div className="flex max-w-prose items-start gap-2.5 text-sm text-text-muted">
              <Icon name="shield-check" className="mt-0.5 shrink-0 text-base text-success" />
              <p className="leading-relaxed">{t("picker.note")}</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-4">
              {selected && (
                <span className="text-right">
                  <span className="block text-xs text-text-muted">{t("picker.total")}</span>
                  <b className="font-display text-2xl font-bold tabular-nums text-text">
                    {formatVnd(selected.priceVnd, i18n.language)}
                  </b>
                </span>
              )}
              <Button
                type="button"
                size="lg"
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
