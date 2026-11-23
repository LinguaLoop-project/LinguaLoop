import { useTranslation } from "react-i18next";
import Skeleton from "@/components/common/Skeleton";
import { useActivity } from "../hooks";
import { activeDayCount, buildHeatWeeks, type HeatLevel } from "../utils";
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

/** Lịch nhiệt các ngày học trong 13 tuần gần nhất, kiểu GitHub (BR-TH-15). */
export default function ActivityHeatmap() {
  const { t, i18n } = useTranslation("stats");
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
        <Skeleton className="h-40 w-full" />
      </section>
    );
  }

  const { from, to, days } = query.data;
  const weeks = buildHeatWeeks(from, to, days);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeZone: "UTC" });
  const monthFormat = new Intl.DateTimeFormat(i18n.language, { month: "short", timeZone: "UTC" });
  // Nhãn tháng ở cột tuần đầu tiên của mỗi tháng.
  const monthLabels = weeks.map((week, i) => {
    const first = week[0];
    if (!first) return null;
    const month = first.date.slice(0, 7);
    const previous = i > 0 ? weeks[i - 1][0]?.date.slice(0, 7) : null;
    return month === previous ? null : monthFormat.format(new Date(`${first.date}T00:00:00Z`));
  });

  return (
    <section className={shell}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold">{t("heatmap.title")}</h2>
        <span className="text-[13px] text-text-muted">{t("heatmap.summary", { count: activeDayCount(days) })}</span>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="inline-flex gap-2">
          <div className="flex flex-col gap-1 pt-5 text-[11px] text-text-muted" aria-hidden="true">
            {WEEKDAY_ROWS.map((key, row) => (
              <span key={key} className="flex h-3.5 items-center">
                {LABELLED_ROWS.has(row) ? t(`streak.weekdays.${key}`) : ""}
              </span>
            ))}
          </div>
          <div>
            <div className="flex gap-1 text-[11px] text-text-muted" aria-hidden="true">
              {monthLabels.map((label, i) => (
                <span key={weeks[i][0]?.date ?? i} className="h-4 w-3.5 overflow-visible whitespace-nowrap">
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-1 flex gap-1" role="group" aria-label={t("heatmap.aria")}>
              {weeks.map((week, i) => (
                <div key={week[0]?.date ?? i} className="flex flex-col gap-1">
                  {week.map((cell, row) =>
                    cell ? (
                      <span
                        key={cell.date}
                        role="img"
                        aria-label={
                          cell.count > 0
                            ? t("heatmap.cell", { date: dateFormat.format(new Date(`${cell.date}T00:00:00Z`)), count: cell.count })
                            : t("heatmap.cellNone", { date: dateFormat.format(new Date(`${cell.date}T00:00:00Z`)) })
                        }
                        title={
                          cell.count > 0
                            ? t("heatmap.cell", { date: dateFormat.format(new Date(`${cell.date}T00:00:00Z`)), count: cell.count })
                            : t("heatmap.cellNone", { date: dateFormat.format(new Date(`${cell.date}T00:00:00Z`)) })
                        }
                        className={`size-3.5 rounded-[3px] ${LEVEL_CLASS[cell.level]}`}
                      />
                    ) : (
                      <span key={`blank-${i}-${row}`} className="size-3.5" aria-hidden="true" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-text-muted" aria-hidden="true">
        {t("heatmap.less")}
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={`size-3 rounded-[3px] ${LEVEL_CLASS[level]}`} />
        ))}
        {t("heatmap.more")}
      </div>
    </section>
  );
}
