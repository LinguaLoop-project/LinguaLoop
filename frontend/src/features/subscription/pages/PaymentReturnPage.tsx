import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import type { ProOrder } from "../types";

const ICON: Record<string, { name: string; tone: string }> = {
  paid: { name: "circle-check", tone: "text-success" },
  pending: { name: "hourglass", tone: "text-warning" },
  canceled: { name: "circle-x", tone: "text-text-muted" },
  failed: { name: "circle-x", tone: "text-danger" },
  expired: { name: "clock", tone: "text-text-muted" },
  invalid: { name: "shield-alert", tone: "text-danger" },
  missing: { name: "circle-x", tone: "text-text-muted" },
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
        <ErrorState
          kind={code === NETWORK_ERROR ? "network" : "server"}
          onRetry={() => void result.refetch()}
          retrying={result.isFetching}
        />
      );
    }
    state = code === "PAYMENT_INVALID_RESULT" ? "invalid" : "missing";
  } else state = order?.status ?? "missing";

  if (state === "loading") {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-16 text-text-muted">
        <Icon name="loader-circle" className="animate-spin text-3xl" />
        {t("result.loading")}
      </div>
    );
  }

  const icon = ICON[state] ?? ICON.missing;
  const title =
    state === "paid" && order?.kind === "renew" ? t("result.paid.titleRenew") : t(`result.${state}.title`);
  const retryable = state === "canceled" || state === "failed" || state === "expired";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-lg border border-border bg-surface px-6 py-10 text-center shadow-[var(--shadow-card)]">
      {state === "paid" ? <Mascot mood="celebrate" size={120} alt="" /> : <Icon name={icon.name} className={`text-5xl ${icon.tone}`} />}
      <div role="status" className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="text-text-muted">
          {state === "paid" && order?.endsAt
            ? t("result.paid.body", { plan: order.planName, date: formatDay(order.endsAt, lang) })
            : t(`result.${state}.body`)}
        </p>
        {state === "failed" && order && (
          <p className="text-sm text-danger">
            {t(`result.reason.${failureReasonKey(order.responseCode)}`, { code: order.responseCode ?? "?" })}
          </p>
        )}
      </div>

      {order && (state === "paid" || state === "pending") && (
        <dl className="grid w-full grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md bg-bg-elevated p-4 text-left text-sm">
          <dt className="text-text-muted">{t("result.receipt.amount")}</dt>
          <dd className="text-right font-semibold tabular-nums">{formatVnd(order.amountVnd, lang)}</dd>
          {order.transactionNo && (
            <>
              <dt className="text-text-muted">{t("result.receipt.txn")}</dt>
              <dd className="text-right font-mono">{order.transactionNo}</dd>
            </>
          )}
          {order.bankCode && (
            <>
              <dt className="text-text-muted">{t("result.receipt.bank")}</dt>
              <dd className="text-right">{order.bankCode}</dd>
            </>
          )}
          {(order.payDate ?? order.paidAt) && (
            <>
              <dt className="text-text-muted">{t("result.receipt.paidAt")}</dt>
              <dd className="text-right">{formatMoment((order.payDate ?? order.paidAt) as string, lang)}</dd>
            </>
          )}
        </dl>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {retryable && (
          <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={payAgain} disabled={checkout.isPending}>
            {t("result.payAgain")}
          </Button>
        )}
        {retryable && (
          <Link to="/student/subscription?choose=1" className={buttonClasses({ variant: "secondary" })}>
            {t("result.choosePlan")}
          </Link>
        )}
        {state === "paid" && returnTo && (
          <Link to={returnTo} onClick={clearReturnTo} className={buttonClasses({ variant: "primary" })}>
            <Icon name="arrow-left" />
            {t("result.goBack")}
          </Link>
        )}
        <Link
          to="/student/subscription"
          className={buttonClasses({ variant: state === "paid" && returnTo ? "secondary" : retryable ? "ghost" : "primary" })}
        >
          {t("result.toSubscription")}
        </Link>
      </div>
    </div>
  );
}
