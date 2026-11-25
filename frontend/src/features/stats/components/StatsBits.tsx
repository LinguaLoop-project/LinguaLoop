import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import SegmentedControl from "@/components/common/SegmentedControl";
import { formatDateTime } from "@/features/user";
import { Link } from "react-router-dom";
import { formatPct, STATS_PERIODS, trendOf } from "../statsFormat";
import type { Metric, StatsPeriod } from "../types";

/** Thành phần dùng chung giữa ba màn thống kê. */

/** Tiêu đề trang, thời điểm số liệu được tính (BR-NK-10) và hàng bộ lọc phía trên mọi biểu đồ. */
export function StatsHeader({
  title,
  computedAt,
  period,
  onPeriod,
  children,
}: Readonly<{
  title: string;
  computedAt: string | undefined;
  period: StatsPeriod;
  onPeriod: (period: StatsPeriod) => void;
  children?: ReactNode;
}>) {
  const { t, i18n } = useTranslation("statsAdmin");
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {computedAt && (
          <p className="text-xs text-text-muted">{t("computedAt", { time: formatDateTime(computedAt, i18n.language) })}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <SegmentedControl
          ariaLabel={t("period")}
          options={STATS_PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))}
          value={period}
          onChange={(p) => onPeriod(p as StatsPeriod)}
        />
        {children}
      </div>
    </>
  );
}

/** Khung có tiêu đề cho một nhóm số liệu hoặc một biểu đồ. */
export function Panel({ title, action, children, className = "" }: Readonly<{ title: string; action?: ReactNode; children: ReactNode; className?: string }>) {
  return (
    <section className={`flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Mức tăng giảm so với kỳ trước, kèm mũi tên và dấu để không chỉ dựa vào màu. */
export function Delta({ metric, upIsGood = true }: Readonly<{ metric: Metric; upIsGood?: boolean }>) {
  const { t, i18n } = useTranslation("statsAdmin");
  const trend = trendOf(metric.changePct);
  if (trend === null) return <span className="text-xs text-text-subtle">{t("noPrevious")}</span>;
  const good = trend === "flat" ? null : (trend === "up") === upIsGood;
  let tone = "text-text-muted";
  if (good === true) tone = "text-success";
  if (good === false) tone = "text-danger";
  const sign = trend === "up" ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
      {trend !== "flat" && <Icon name={trend === "up" ? "trending-up" : "trending-down"} className="size-3.5" />}
      {sign}
      {formatPct(metric.changePct, i18n.language)}
      <span className="font-normal text-text-subtle">{t("vsPrevious")}</span>
    </span>
  );
}

/** Ô chỉ số: nhãn, giá trị, dòng phụ (mức tăng giảm hoặc chú thích). */
export function StatTile({ label, value, sub }: Readonly<{ label: string; value: string; sub?: ReactNode }>) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-surface p-4">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="truncate text-2xl font-semibold text-text">{value}</span>
      {sub && <div className="min-h-4">{sub}</div>}
    </div>
  );
}

/** Danh sách xếp hạng tối đa 5 mục (UC-NK-03 Bước 4). */
export function RankedList({
  items,
  unit,
  emptyText,
  to,
}: Readonly<{
  items: { id: string; name: string; ownerName: string | null; value: number }[];
  unit: (value: number) => string;
  emptyText: string;
  to?: (id: string) => string;
}>) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-text-muted">{emptyText}</p>;
  return (
    <ol className="flex flex-col divide-y divide-border">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            {to ? (
              <Link to={to(item.id)} className="truncate font-medium text-text hover:underline">
                {item.name}
              </Link>
            ) : (
              <span className="truncate font-medium text-text">{item.name}</span>
            )}
            {item.ownerName && <span className="truncate text-xs text-text-muted">{item.ownerName}</span>}
          </div>
          <span className="shrink-0 font-semibold text-text tabular-nums">{unit(item.value)}</span>
        </li>
      ))}
    </ol>
  );
}
