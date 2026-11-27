import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import Skeleton from "@/components/common/Skeleton";
import { formatVnd } from "@/features/user";
import { useOrders } from "../hooks/usePayment";
import type { OrderStatus, ProOrder } from "../types";
import { formatDay, formatMoment } from "./format";

type HistoryFilter = "all" | "paid" | "pending" | "unpaid";

const PAGE_SIZE = 6;

const STATUS_STYLE: Record<OrderStatus, { badge: string; icon: string }> = {
  pending: { badge: "warning", icon: "hourglass" },
  paid: { badge: "success", icon: "circle-check" },
  canceled: { badge: "default", icon: "circle-x" },
  failed: { badge: "danger", icon: "triangle-alert" },
  expired: { badge: "default", icon: "clock" },
};

function matchesFilter(order: ProOrder, filter: HistoryFilter): boolean {
  if (filter === "all") return true;
  if (filter === "paid") return order.status === "paid";
  if (filter === "pending") return order.status === "pending";
  return order.status === "canceled" || order.status === "failed" || order.status === "expired";
}

function amountClass(status: OrderStatus): string {
  if (status === "paid" || status === "pending") return "font-semibold text-text";
  if (status === "canceled") return "font-medium text-text-muted line-through decoration-text-muted/50";
  return "font-medium text-text-muted";
}

function TxnCopyCell({ txn, copyLabel, copiedLabel }: { txn: string | null; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  if (!txn || txn === "0") {
    return <span className="text-text-muted/60">—</span>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(txn);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Bỏ qua nếu trình duyệt chặn clipboard
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-xs text-text">{txn}</span>
      <button
        type="button"
        onClick={() => void copy()}
        title={copied ? copiedLabel : copyLabel}
        aria-label={copied ? copiedLabel : copyLabel}
        className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-transparent text-text-muted transition-colors hover:border-border hover:bg-bg-elevated hover:text-text"
      >
        <Icon name={copied ? "check" : "copy"} className={`text-xs ${copied ? "text-success" : ""}`} />
      </button>
    </span>
  );
}

/** Lịch sử giao dịch của chính học viên, mới nhất trước (UC-PR-01 bước 4, BR-PR-03). */
export default function OrderHistory() {
  const { t, i18n } = useTranslation("subscription");
  const orders = useOrders();
  const lang = i18n.language;
  const [chosenFilter, setFilter] = useState<HistoryFilter>("all");
  const [page, setPage] = useState(0);

  const allOrders = useMemo(() => orders.data ?? [], [orders.data]);

  const counts = useMemo(
    () => ({
      all: allOrders.length,
      paid: allOrders.filter((o) => o.status === "paid").length,
      pending: allOrders.filter((o) => o.status === "pending").length,
      unpaid: allOrders.filter((o) => o.status === "canceled" || o.status === "failed" || o.status === "expired").length,
    }),
    [allOrders],
  );

  // Tab "Chờ thanh toán" chỉ có khi còn đơn chờ; đơn hết hạn thì tab biến mất, bộ lọc tự về "Tất cả"
  const filterOptions: HistoryFilter[] = counts.pending > 0 ? ["all", "paid", "pending", "unpaid"] : ["all", "paid", "unpaid"];
  const filter = filterOptions.includes(chosenFilter) ? chosenFilter : "all";
  const filtered = useMemo(() => allOrders.filter((o) => matchesFilter(o, filter)), [allOrders, filter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);

  const selectFilter = (next: HistoryFilter) => {
    setFilter(next);
    setPage(0);
  };

  let body;
  if (orders.isLoading) {
    body = <Skeleton className="h-44 w-full rounded-2xl" />;
  } else if (orders.isError || !orders.data) {
    body = (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5">
        <FormAlert variant="danger">{t("loadFailed")}</FormAlert>
        <Button type="button" leftIcon={<Icon name="rotate-cw" />} onClick={() => void orders.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  } else if (allOrders.length === 0) {
    body = (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center text-text-muted">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-bg-elevated text-text-muted">
          <Icon name="credit-card" className="text-xl" />
        </span>
        <p className="text-sm">{t("history.empty")}</p>
      </div>
    );
  } else if (filtered.length === 0) {
    body = (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-6 py-10 text-center text-text-muted">
        <Icon name="filter" className="text-xl text-text-muted/70" />
        <p className="text-sm">{t("history.emptyFiltered")}</p>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-4">
        {/* Dạng bảng cho màn hình vừa & lớn */}
        <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/60 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3.5">{t("history.columns.date")}</th>
                <th className="px-5 py-3.5">{t("history.columns.plan")}</th>
                <th className="px-5 py-3.5">{t("history.columns.kind")}</th>
                <th className="py-3.5 pl-5 pr-8 text-right">{t("history.columns.amount")}</th>
                <th className="py-3.5 pl-4 pr-5">{t("history.columns.status")}</th>
                <th className="px-5 py-3.5">{t("history.columns.period")}</th>
                <th className="px-5 py-3.5">{t("history.columns.txn")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const st = STATUS_STYLE[o.status];
                return (
                  <tr key={o.id} className="border-b border-border/80 transition-colors last:border-0 hover:bg-surface-hover/40">
                    <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-text-muted">{formatMoment(o.createdAt, lang)}</td>
                    <td className={`px-5 py-3.5 ${o.status === "paid" ? "font-semibold text-text" : "font-medium text-text/85"}`}>
                      {o.planName}
                    </td>
                    <td className="px-5 py-3.5 text-text-muted">{t(`kind.${o.kind}`)}</td>
                    <td className={`whitespace-nowrap py-3.5 pl-5 pr-8 text-right tabular-nums ${amountClass(o.status)}`}>
                      {formatVnd(o.amountVnd, lang)}
                    </td>
                    <td className="py-3.5 pl-4 pr-5">
                      <Badge variant={st.badge}>
                        <Icon name={st.icon} />
                        {t(`status.${o.status}`)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-text-muted">
                      {o.startsAt && o.endsAt ? `${formatDay(o.startsAt, lang)} – ${formatDay(o.endsAt, lang)}` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <TxnCopyCell txn={o.transactionNo} copyLabel={t("history.copyTxn")} copiedLabel={t("history.copied")} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dạng thẻ gọn cho mobile */}
        <div className="flex flex-col gap-3 md:hidden">
          {visible.map((o) => {
            const st = STATUS_STYLE[o.status];
            return (
              <div key={o.id} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-text">{o.planName}</div>
                    <div className="text-xs text-text-muted">
                      {t(`kind.${o.kind}`)} · {formatMoment(o.createdAt, lang)}
                    </div>
                  </div>
                  <Badge variant={st.badge}>
                    <Icon name={st.icon} />
                    {t(`status.${o.status}`)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t border-border/70 pt-2.5 text-sm">
                  <span className={`tabular-nums ${amountClass(o.status)}`}>{formatVnd(o.amountVnd, lang)}</span>
                  <TxnCopyCell txn={o.transactionNo} copyLabel={t("history.copyTxn")} copiedLabel={t("history.copied")} />
                </div>

                {o.startsAt && o.endsAt && (
                  <div className="text-xs text-text-muted">
                    {t("history.columns.period")}: {formatDay(o.startsAt, lang)} – {formatDay(o.endsAt, lang)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Thanh phân trang + số lượng đang hiển thị */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-text-muted">
              {t("history.showing", { from, to, total: filtered.length })}
            </span>
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    );
  }

  return (
    <section aria-labelledby="order-history-title" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon name="history" className="text-lg text-primary-text" />
          <h2 id="order-history-title" className="font-display text-xl font-bold">
            {t("history.title")}
          </h2>
          {allOrders.length > 0 && <Badge>{allOrders.length}</Badge>}
        </div>

        {allOrders.length > 0 && (
          <div role="group" aria-label={t("history.filters.label")} className="flex flex-wrap items-center gap-1.5">
            {filterOptions.map((key) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectFilter(key)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary/40 bg-primary-soft text-primary-text"
                      : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
                  }`}
                >
                  <span>{t(`history.filters.${key}`)}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none tabular-nums ${
                      active ? "bg-primary/20 text-primary-text" : "bg-bg-elevated text-text-muted"
                    }`}
                  >
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {body}
    </section>
  );
}
