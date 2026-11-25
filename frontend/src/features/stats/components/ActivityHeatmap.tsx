import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { useActivity } from "../hooks";
import { activitySummary, activityWindowStart, buildHeatWeeks, type HeatCell, type HeatLevel } from "../utils";
import StatsError from "./StatsError";

const LEVEL_CLASS: Record<HeatLevel, string> = {
  0: "bg-bg-elevated",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};

const WEEKDAY_ROWS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
/** Chỉ ghi nhãn thứ Hai, Tư, Sáu cho gọn. */
const LABELLED_ROWS = new Set([0, 2, 4]);

function KpiTile({
  icon,
  iconShell,
  value,
  label,
}: {
  icon: string;
  iconShell: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-border/70 bg-bg-elevated/70 p-4 transition-colors hover:border-border-strong">
      <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${iconShell}`}>
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="font-display text-2xl font-bold leading-tight tabular-nums xl:text-[28px]">{value}</div>
        <div className="mt-0.5 text-[13px] text-text-muted">{label}</div>
      </div>
    </div>
  );
}

/** Lịch nhiệt các ngày học trong 90 ngày gần nhất, phóng lớn cân đối kèm 4 KPI và chi tiết hover (BR-TH-15). */
export default function ActivityHeatmap({ longestStreak }: { longestStreak?: number }) {
  const { t, i18n } = useTranslation("stats");
  const [hoveredCell, setHoveredCell] = useState<HeatCell | null>(null);
  const query = useActivity();
  const shell = "rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";

  if (query.isError) {
    return (
      <section className={shell}>
        <StatsError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </section>
    );
  }
  if (!query.data) {
    return (
      <section className={shell} aria-busy="true">
        <Skeleton className="h-44 w-full" />
      </section>
    );
  }

  const { from, to, days } = query.data;
  const weeks = buildHeatWeeks(from, to, days, activityWindowStart(to));
  const totalCalendarDays = weeks.reduce((sum, w) => sum + w.filter((c) => c !== null).length, 0);
  const { activeDays, totalActivities, bestDayCount } = activitySummary(days);

  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeZone: "UTC" });
  const monthFormat = new Intl.DateTimeFormat(i18n.language, { month: "short", timeZone: "UTC" });
  // Nhãn tháng ở cột tuần đầu tiên của mỗi tháng; bỏ nhãn ở cột quá sát nhãn kế tiếp (< 3 cột) để không đè chữ.
  const firstCellOf = (week: (HeatCell | null)[]) => week.find((cell) => cell !== null) ?? null;
  const rawMonthLabels = weeks.map((week, i) => {
    const first = firstCellOf(week);
    if (!first) return null;
    const month = first.date.slice(0, 7);
    const previous = i > 0 ? firstCellOf(weeks[i - 1])?.date.slice(0, 7) : null;
    return month === previous ? null : monthFormat.format(new Date(`${first.date}T00:00:00Z`));
  });
  const monthLabels = rawMonthLabels.map((label, i) => {
    if (!label) return null;
    const nextIdx = rawMonthLabels.findIndex((other, j) => j > i && other !== null);
    if (nextIdx !== -1 && nextIdx - i < 3) return null;
    return label;
  });

  const cellText = (cell: HeatCell) =>
    cell.count > 0
      ? t("heatmap.cell", { date: dateFormat.format(new Date(`${cell.date}T00:00:00Z`)), count: cell.count })
      : t("heatmap.cellNone", { date: dateFormat.format(new Date(`${cell.date}T00:00:00Z`)) });

  return (
    <section className={shell}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold">{t("heatmap.title")}</h3>
        <span className="text-[13px] text-text-muted">{t("heatmap.summary", { count: activeDays })}</span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex gap-2.5 xl:gap-3">
            <div className="flex flex-col gap-1.5 pt-5 text-[11px] text-text-muted xl:gap-2" aria-hidden="true">
              {WEEKDAY_ROWS.map((key, row) => (
                <span key={key} className="flex h-4 items-center sm:h-5 xl:h-6">
                  {LABELLED_ROWS.has(row) ? t(`streak.weekdays.${key}`) : ""}
                </span>
              ))}
            </div>
            <div>
              <div className="flex gap-1.5 text-[11px] text-text-muted xl:gap-2" aria-hidden="true">
                {monthLabels.map((label, i) => (
                  <span key={weeks[i][0]?.date ?? i} className="h-4 w-4 overflow-visible whitespace-nowrap sm:w-5 xl:w-6">
                    {label}
                  </span>
                ))}
              </div>
              <div
                className="mt-1 flex gap-1.5 xl:gap-2"
                role="group"
                aria-label={t("heatmap.aria")}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {weeks.map((week, i) => (
                  <div key={week[0]?.date ?? i} className="flex flex-col gap-1.5 xl:gap-2">
                    {week.map((cell, row) =>
                      cell ? (
                        <span
                          key={cell.date}
                          role="img"
                          aria-label={cellText(cell)}
                          title={cellText(cell)}
                          tabIndex={0}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onFocus={() => setHoveredCell(cell)}
                          onBlur={() => setHoveredCell(null)}
                          className={`size-4 cursor-default rounded-[4px] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-primary hover:scale-115 sm:size-5 xl:size-6 xl:rounded-[5px] ${LEVEL_CLASS[cell.level]} ${
                            hoveredCell?.date === cell.date ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""
                          }`}
                        />
                      ) : (
                        <span key={`blank-${i}-${row}`} className="size-4 sm:size-5 xl:size-6" aria-hidden="true" />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
            <span className="font-medium text-text-muted">
              {hoveredCell ? <span className="text-text">{cellText(hoveredCell)}</span> : t("heatmap.hoverHint")}
            </span>
            <div className="flex items-center gap-1.5 text-[11px]" aria-hidden="true">
              {t("heatmap.less")}
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <span key={level} className={`size-3 rounded-[3px] ${LEVEL_CLASS[level]}`} />
              ))}
              {t("heatmap.more")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:border-l lg:border-border lg:pl-6">
          <KpiTile
            icon="calendar"
            iconShell="bg-primary-soft text-primary-text"
            value={t("heatmap.kpiActiveValue", { active: activeDays, total: totalCalendarDays })}
            label={t("heatmap.kpiActiveRate")}
          />
          <KpiTile
            icon="flame"
            iconShell="bg-fn-vocab-soft text-fn-vocab"
            value={longestStreak === undefined ? "—" : t("streak.days", { count: longestStreak })}
            label={t("heatmap.kpiLongestStreak")}
          />
          <KpiTile
            icon="trending-up"
            iconShell="bg-success/15 text-success"
            value={totalActivities}
            label={t("heatmap.kpiTotalActivities")}
          />
          <KpiTile
            icon="zap"
            iconShell="bg-warning/15 text-warning"
            value={bestDayCount}
            label={t("heatmap.kpiBestDay")}
          />
        </div>
      </div>
    </section>
  );
}
