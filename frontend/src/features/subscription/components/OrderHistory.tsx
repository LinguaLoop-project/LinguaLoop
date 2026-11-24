import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { formatVnd } from "@/features/user";
import { useOrders } from "../hooks/usePayment";
import type { OrderStatus } from "../types";
import { formatDay, formatMoment } from "./format";

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "warning",
  paid: "success",
  canceled: "default",
  failed: "danger",
  expired: "default",
};

/** Lịch sử giao dịch của chính học viên, mới nhất trước (UC-PR-01 bước 4, BR-PR-03). */
export default function OrderHistory() {
  const { t, i18n } = useTranslation("subscription");
  const orders = useOrders();
  const lang = i18n.language;

  let body;
  if (orders.isLoading) {
    body = <Skeleton className="h-32 w-full" />;
  } else if (orders.isError || !orders.data) {
    body = (
      <div className="flex flex-col items-start gap-3">
        <FormAlert variant="danger">{t("loadFailed")}</FormAlert>
        <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={() => void orders.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  } else if (orders.data.length === 0) {
    body = <p className="text-sm text-text-muted">{t("history.empty")}</p>;
  } else {
    body = (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-4 py-3 font-semibold">{t("history.columns.date")}</th>
              <th className="px-4 py-3 font-semibold">{t("history.columns.plan")}</th>
              <th className="px-4 py-3 font-semibold">{t("history.columns.kind")}</th>
              <th className="px-4 py-3 text-right font-semibold">{t("history.columns.amount")}</th>
              <th className="px-4 py-3 font-semibold">{t("history.columns.status")}</th>
              <th className="px-4 py-3 font-semibold">{t("history.columns.period")}</th>
              <th className="px-4 py-3 font-semibold">{t("history.columns.txn")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.data.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3">{formatMoment(o.createdAt, lang)}</td>
                <td className="px-4 py-3 font-medium">{o.planName}</td>
                <td className="px-4 py-3">{t(`kind.${o.kind}`)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatVnd(o.amountVnd, lang)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[o.status]}>{t(`status.${o.status}`)}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                  {o.startsAt && o.endsAt ? `${formatDay(o.startsAt, lang)} – ${formatDay(o.endsAt, lang)}` : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{o.transactionNo ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section aria-labelledby="order-history-title" className="flex flex-col gap-3">
      <h2 id="order-history-title" className="font-display text-xl font-bold">
        {t("history.title")}
      </h2>
      {body}
    </section>
  );
}
