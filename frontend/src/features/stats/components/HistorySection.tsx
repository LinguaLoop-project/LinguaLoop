import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { useAuthStore } from "@/features/auth";
import { useHistory } from "../hooks";
import type { StatsRange } from "../types";
import {
  DEFAULT_RANGE,
  dayKeyInZone,
  groupHistoryByDate,
  HISTORY_DAYS_PER_PAGE,
  HISTORY_MODES,
  INITIAL_ITEMS_PER_DAY,
  parseHistoryMode,
  parsePage,
  previousDayKey,
} from "../utils";
import HistoryRow from "./HistoryRow";
import StatsError from "./StatsError";

/**
 * Lịch sử luyện tập (UC-TH-02): lọc theo chế độ và Khoảng thống kê, mỗi trang hiển thị tối đa 3 ngày gần nhất có hoạt động
 * khớp bộ lọc. Những ngày có nhiều hoạt động (> 3) tự động hiển thị 3 hoạt động mới nhất kèm nút "Xem thêm / Thu gọn" ngay
 * dưới ngày đó để chiều cao trang luôn gọn và cân đối.
 */
export default function HistorySection({
  range,
  onRangeChange,
}: {
  range: StatsRange;
  onRangeChange: (range: StatsRange) => void;
}) {
  const { t, i18n } = useTranslation("stats");
  const [params, setParams] = useSearchParams();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const mode = parseHistoryMode(params.get("mode"));
  const page = parsePage(params.get("page"));
  const query = useHistory(mode, range, page);

  const update = (change: (next: URLSearchParams) => void) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        change(next);
        return next;
      },
      { replace: true },
    );

  const changeMode = (value: string) => {
    setExpandedDays({});
    update((next) => {
      const picked = parseHistoryMode(value);
      if (picked === "all") next.delete("mode");
      else next.set("mode", picked);
      next.delete("page");
    });
  };

  const changePage = (nextPage: number) => {
    setExpandedDays({});
    update((next) => {
      if (nextPage > 0) next.set("page", String(nextPage + 1));
      else next.delete("page");
    });
  };

  const clearFilters = () => {
    setExpandedDays({});
    update((next) => {
      next.delete("mode");
      next.delete("page");
    });
    if (range !== DEFAULT_RANGE) onRangeChange(DEFAULT_RANGE);
  };

  const toggleDayExpand = (dayKey: string) => {
    setExpandedDays((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const data = query.data;
  const filtered = mode !== "all" || range !== DEFAULT_RANGE;
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  // Ngày của backend tính theo múi giờ hồ sơ học viên, nên "Hôm nay"/"Hôm qua" cũng phải tính theo múi giờ đó.
  const timeZone = useAuthStore((state) => state.user?.timezone);
  const todayKey = dayKeyInZone(new Date(), timeZone);
  const yesterdayKey = previousDayKey(todayKey);
  const groups = data ? groupHistoryByDate(data.items, mode, HISTORY_DAYS_PER_PAGE, timeZone) : [];

  const formatGroupLabel = (dayKey: string) => {
    const parsed = new Date(`${dayKey}T00:00:00`);
    const formatted = Number.isNaN(parsed.getTime())
      ? dayKey
      : parsed.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    if (dayKey === todayKey) return `${t("history.groupToday")} · ${formatted}`;
    if (dayKey === yesterdayKey) return `${t("history.groupYesterday")} · ${formatted}`;
    return formatted;
  };

  return (
    <section aria-labelledby="stats-history-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="stats-history-title" className="font-display text-2xl font-bold">
            {t("history.title")}
          </h2>
          {data && <p className="text-[13px] text-text-muted">{t("history.total", { count: data.totalElements })}</p>}
        </div>
        <div className="max-w-full overflow-x-auto">
          <SegmentedControl
            ariaLabel={t("history.modeLabel")}
            value={mode}
            options={HISTORY_MODES.map((m) => ({ value: m, label: t(`history.mode.${m}`) }))}
            onChange={changeMode}
          />
        </div>
      </div>

      <div aria-busy={query.isFetching}>
        {query.isError ? (
          <StatsError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : !data ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[66px] w-full rounded-lg" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="history"
            title={t("history.empty.title")}
            description={t("history.empty.desc")}
            actionText={filtered ? t("history.empty.clear") : undefined}
            onAction={filtered ? clearFilters : undefined}
          />
        ) : (
          <>
            <div className="flex flex-col gap-5">
              {groups.map((group) => {
                const isDayExpanded = Boolean(expandedDays[group.dayKey]);
                const totalInDay = group.items.length;
                const hasOverflow = totalInDay > INITIAL_ITEMS_PER_DAY;
                const visibleItems = isDayExpanded ? group.items : group.items.slice(0, INITIAL_ITEMS_PER_DAY);
                const hiddenCount = totalInDay - INITIAL_ITEMS_PER_DAY;

                return (
                  <div key={group.dayKey} className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        <Icon name="calendar" className="size-3.5 text-primary-text" />
                        <span>{formatGroupLabel(group.dayKey)}</span>
                      </div>
                      <Badge>{t("history.dayCount", { count: totalInDay })}</Badge>
                    </div>

                    <ul className="flex flex-col gap-2.5 border-l-2 border-border pl-3.5">
                      {visibleItems.map((item, idx) => (
                        <HistoryRow
                          key={`${item.type}-${item.mode}-${item.at}-${item.lessonId ?? item.deckId ?? idx}`}
                          item={item}
                          compactTime
                        />
                      ))}
                    </ul>

                    {hasOverflow && (
                      <div className="pl-3.5">
                        <button
                          type="button"
                          onClick={() => toggleDayExpand(group.dayKey)}
                          aria-expanded={isDayExpanded}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-surface-hover/50 px-3 py-2 text-xs font-semibold text-primary-text transition-colors hover:border-border-strong hover:bg-surface-hover"
                        >
                          <span>
                            {isDayExpanded ? t("history.showLessDay") : t("history.showMoreDay", { count: hiddenCount })}
                          </span>
                          <Icon name={isDayExpanded ? "chevron-up" : "chevron-down"} className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {data.totalPages > 1 && (
              <Pagination className="mt-5" page={data.page} totalPages={data.totalPages} onChange={changePage} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
