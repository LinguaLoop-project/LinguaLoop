import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/common/EmptyState";
import Pagination from "@/components/common/Pagination";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { useHistory } from "../hooks";
import type { StatsRange } from "../types";
import { DEFAULT_RANGE, HISTORY_MODES, parseHistoryMode, parsePage } from "../utils";
import HistoryRow from "./HistoryRow";
import StatsError from "./StatsError";

/**
 * Lịch sử luyện tập (UC-TH-02): lọc theo chế độ và Khoảng thống kê, 20 dòng mỗi trang. Chế độ và trang lưu trên địa chỉ
 * (`?mode=shadowing&page=2`); khoảng do trang cha giữ vì dùng chung với các thẻ thống kê.
 */
export default function HistorySection({
  range,
  onRangeChange,
}: {
  range: StatsRange;
  onRangeChange: (range: StatsRange) => void;
}) {
  const { t } = useTranslation("stats");
  const [params, setParams] = useSearchParams();
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

  const changeMode = (value: string) =>
    update((next) => {
      const picked = parseHistoryMode(value);
      if (picked === "all") next.delete("mode");
      else next.set("mode", picked);
      next.delete("page");
    });

  const changePage = (nextPage: number) =>
    update((next) => {
      if (nextPage > 0) next.set("page", String(nextPage + 1));
      else next.delete("page");
    });

  const clearFilters = () => {
    update((next) => {
      next.delete("mode");
      next.delete("page");
    });
    if (range !== DEFAULT_RANGE) onRangeChange(DEFAULT_RANGE);
  };

  const data = query.data;
  const filtered = mode !== "all" || range !== DEFAULT_RANGE;

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
        ) : data.items.length === 0 ? (
          <EmptyState
            icon="history"
            title={t("history.empty.title")}
            description={t("history.empty.desc")}
            actionText={filtered ? t("history.empty.clear") : undefined}
            onAction={filtered ? clearFilters : undefined}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {data.items.map((item) => (
                <HistoryRow key={`${item.type}-${item.mode}-${item.at}-${item.lessonId ?? item.deckId ?? ""}`} item={item} />
              ))}
            </ul>
            {data.totalPages > 1 && (
              <Pagination className="mt-5" page={data.page} totalPages={data.totalPages} onChange={changePage} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
