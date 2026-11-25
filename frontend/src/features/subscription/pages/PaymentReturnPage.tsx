import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { buttonClasses } from "@/components/common/buttonStyles";
import { toApiError, NETWORK_ERROR } from "@/features/auth/errors";
import { formatVnd } from "@/features/user";
import { formatDay, formatMoment } from "../components/format";
import { useMyPlan } from "../hooks/useMyPlan";
import { useCheckout, usePaymentResult, usePendingOrder, useRefreshPlan } from "../hooks/usePayment";
import { clearReturnTo, failureReasonKey, peekReturnTo, vnpayParams } from "../payment";
import type { OrderStatus, ProOrder } from "../types";

interface StateVisual {
  icon: string;
  emblem: string;
  accent: string;
  badge?: { variant: string; labelKey: string };
}

const STATE_VISUAL: Record<string, StateVisual> = {
  paid: {
    icon: "circle-check",
    emblem: "bg-success/15 text-success ring-1 ring-success/30",
    accent: "from-success/12 via-surface to-surface border-success/30",
    badge: { variant: "success", labelKey: "status.paid" },
  },
  pending: {
    icon: "hourglass",
    emblem: "bg-warning/15 text-warning ring-1 ring-warning/30",
    accent: "from-warning/12 via-surface to-surface border-warning/30",
    badge: { variant: "warning", labelKey: "status.pending" },
  },
  canceled: {
    icon: "circle-x",
    emblem: "bg-warning/15 text-warning ring-1 ring-warning/30",
    accent: "from-warning/10 via-surface to-surface border-border",
    badge: { variant: "default", labelKey: "status.canceled" },
  },
  failed: {
    icon: "circle-x",
    emblem: "bg-danger/15 text-danger ring-1 ring-danger/30",
    accent: "from-danger/12 via-surface to-surface border-danger/30",
    badge: { variant: "danger", labelKey: "status.failed" },
  },
  expired: {
    icon: "clock",
    emblem: "bg-warning/15 text-warning ring-1 ring-warning/30",
    accent: "from-warning/10 via-surface to-surface border-border",
    badge: { variant: "default", labelKey: "status.expired" },
  },
  invalid: {
    icon: "shield-alert",
    emblem: "bg-danger/15 text-danger ring-1 ring-danger/30",
    accent: "from-danger/12 via-surface to-surface border-danger/30",
  },
  missing: {
    icon: "circle-x",
    emblem: "bg-bg-elevated text-text-muted ring-1 ring-border",
    accent: "from-bg-elevated/60 via-surface to-surface border-border",
  },
};

const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "warning",
  paid: "success",
  canceled: "default",
  failed: "danger",
  expired: "default",
};

/**
 * Trang VNPAY chuyển học viên về (Return URL, UC-PR-03): gửi nguyên tham số cho server kiểm chữ ký rồi hiện kết quả.
 * Không tự kết luận thành công từ tham số trên đường dẫn (AC-PR-17). `?order=` dùng khi gói 0 đồng được kích hoạt ngay.
 */
export default function PaymentReturnPage() {
  const { t, i18n } = useTranslation("subscription");
  const location = useLocation();
  const navigate = useNavigate();
  const lang = i18n.language;

  const vnp = useMemo(() => vnpayParams(location.search), [location.search]);
  const orderParam = useMemo(() => new URLSearchParams(location.search).get("order"), [location.search]);
  const result = usePaymentResult(vnp, orderParam);
  const pending = usePendingOrder(result.data?.status === "pending" ? result.data.id : null);
  const order: ProOrder | undefined = pending.data ?? result.data;

  const plan = useMyPlan();
  const checkout = useCheckout();
  const refresh = useRefreshPlan();
  const [returnTo] = useState(peekReturnTo);

  // Thành công thì đọc lại gói và ví để quyền lợi Pro mở ngay (AC-PR-07)
  const status = order?.status;
  useEffect(() => {
    if (status === "paid") void refresh();
  }, [status, refresh]);

  const payAgain = () => {
    if (!order?.planId) {
      navigate("/student/subscription?choose=1");
      return;
    }
    const kind = plan.data?.plan === "pro" ? "renew" : "upgrade";
    checkout.mutate(
      { planId: order.planId, kind },
      {
        onSuccess: ({ order: next, paymentUrl }) => {
          if (paymentUrl) window.location.assign(paymentUrl);
          else navigate(`/payment/vnpay-return?order=${next.id}`, { replace: true });
        },
        onError: () => navigate("/student/subscription?choose=1"),
      },
    );
  };

  let state: string;
  if (!orderParam && Object.keys(vnp).length === 0) state = "missing";
  else if (result.isLoading) state = "loading";
  else if (result.isError) {
    const code = toApiError(result.error).code;
    if (code === NETWORK_ERROR || code === "INTERNAL_ERROR") {
      return (
        <div className="flex min-h-[calc(100vh-18rem)] items-center justify-center py-8">
          <ErrorState
            kind={code === NETWORK_ERROR ? "network" : "server"}
            onRetry={() => void result.refetch()}
            retrying={result.isFetching}
          />
        </div>
      );
    }
    state = code === "PAYMENT_INVALID_RESULT" ? "invalid" : "missing";
  } else state = order?.status ?? "missing";

  if (state === "loading") {
    return (
      <div role="status" className="flex min-h-[calc(100vh-18rem)] flex-col items-center justify-center gap-3 py-16 text-text-muted">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
          <Icon name="loader-circle" className="animate-spin text-3xl" />
        </span>
        <span className="text-sm font-medium">{t("result.loading")}</span>
      </div>
    );
  }

  const visual = STATE_VISUAL[state] ?? STATE_VISUAL.missing;
  const title =
    state === "paid" && order?.kind === "renew" ? t("result.paid.titleRenew") : t(`result.${state}.title`);
  const retryable = state === "canceled" || state === "failed" || state === "expired";
  const hasTxn = Boolean(order?.transactionNo && order.transactionNo !== "0");
  const timestamp = order ? (order.payDate ?? order.paidAt ?? order.createdAt) : null;
  const timestampLabel = order?.payDate || order?.paidAt ? t("result.receipt.paidAt") : t("result.receipt.createdAt");

  return (
    <div className="flex min-h-[calc(100vh-18rem)] items-center justify-center py-8">
      <div
        className={`mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border bg-gradient-to-b px-6 py-8 text-center shadow-[var(--shadow-card)] sm:px-8 sm:py-10 ${visual.accent}`}
      >
        {/* Biểu tượng trạng thái */}
        {state === "paid" ? (
          <Mascot mood="celebrate" size={116} alt="" />
        ) : (
          <span className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${visual.emblem}`}>
            <Icon name={visual.icon} className="text-3xl" />
          </span>
        )}

        {/* Tiêu đề & mô tả */}
        <div role="status" className="flex flex-col items-center gap-2.5">
          {visual.badge && <Badge variant={visual.badge.variant}>{t(visual.badge.labelKey)}</Badge>}
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-md text-sm leading-relaxed text-text-muted">
            {state === "paid" && order?.endsAt
              ? t("result.paid.body", { plan: order.planName, date: formatDay(order.endsAt, lang) })
              : t(`result.${state}.body`)}
          </p>
        </div>

        {/* Hộp lý do thất bại từ VNPAY */}
        {state === "failed" && order && (
          <div className="flex w-full items-start gap-3 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-left">
            <Icon name="triangle-alert" className="mt-0.5 shrink-0 text-lg text-danger" />
            <div className="min-w-0 text-sm">
              <div className="font-semibold text-danger">{t("result.reasonLabel")}</div>
              <p className="mt-0.5 leading-relaxed text-text">
                {t(`result.reason.${failureReasonKey(order.responseCode)}`, { code: order.responseCode ?? "?" })}
              </p>
            </div>
          </div>
        )}

        {/* Chi tiết đơn hàng (hiện cho cả thành công, đang chờ, đã hủy, thất bại, hết hạn) */}
        {order && (
          <div className="w-full rounded-xl border border-border bg-bg-elevated/80 p-4 text-left">
            <div className="mb-3 flex items-center justify-between border-b border-border/80 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("result.receipt.title")}
              </span>
              <Badge variant={ORDER_STATUS_BADGE[order.status]}>{t(`status.${order.status}`)}</Badge>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
              <dt className="text-text-muted">{t("result.receipt.plan")}</dt>
              <dd className="text-right font-medium text-text">
                {order.planName} ({t("picker.months", { count: order.months })})
              </dd>

              <dt className="text-text-muted">{t("result.receipt.amount")}</dt>
              <dd className="text-right font-display text-base font-bold tabular-nums text-text">
                {formatVnd(order.amountVnd, lang)}
              </dd>

              {hasTxn && (
                <>
                  <dt className="text-text-muted">{t("result.receipt.txn")}</dt>
                  <dd className="text-right font-mono text-xs text-text">{order.transactionNo}</dd>
                </>
              )}

              {order.bankCode && (
                <>
                  <dt className="text-text-muted">{t("result.receipt.bank")}</dt>
                  <dd className="text-right font-medium text-text">{order.bankCode}</dd>
                </>
              )}

              {timestamp && (
                <>
                  <dt className="text-text-muted">{timestampLabel}</dt>
                  <dd className="text-right tabular-nums text-text-muted">{formatMoment(timestamp, lang)}</dd>
                </>
              )}
            </dl>
          </div>
        )}

        {/* Ghi chú trấn an khi giao dịch chưa hoàn tất */}
        {retryable && (
          <div className="flex w-full items-start gap-2.5 rounded-xl border border-border/70 bg-bg-elevated/45 px-4 py-3 text-left text-xs leading-relaxed text-text-muted">
            <Icon name="shield-check" className="mt-0.5 shrink-0 text-sm text-primary-text" />
            <span>{t("result.noChargeHint")}</span>
          </div>
        )}

        {/* Cụm nút hành động */}
        <div className="flex w-full flex-col gap-2.5 pt-1">
          {retryable ? (
            <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  fullWidth
                  leftIcon={<Icon name={checkout.isPending ? "loader-circle" : "rotate-cw"} className={checkout.isPending ? "animate-spin" : undefined} />}
                  onClick={payAgain}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? t("result.retrying") : t("result.payAgain")}
                </Button>
                <Link to="/student/subscription?choose=1" className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}>
                  {t("result.choosePlan")}
                </Link>
              </div>
              <Link to="/student/subscription" className={buttonClasses({ variant: "ghost", size: "sm", fullWidth: true })}>
                <Icon name="arrow-left" />
                {t("result.toSubscription")}
              </Link>
            </>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {state === "paid" && returnTo && (
                <Link to={returnTo} onClick={clearReturnTo} className={buttonClasses({ variant: "primary", size: "lg" })}>
                  <Icon name="arrow-left" />
                  {t("result.goBack")}
                </Link>
              )}
              <Link
                to="/student/subscription"
                className={buttonClasses({
                  variant: state === "paid" && returnTo ? "secondary" : "primary",
                  size: "lg",
                })}
              >
                {t("result.toSubscription")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
