import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { useStatsOverview } from "../hooks";
import type { StatsOverview } from "../types";
import { useRangeParam } from "../useRangeParam";
import ActivityHeatmap from "./ActivityHeatmap";
import HistorySection from "./HistorySection";
import RangeTabs from "./RangeTabs";
import StatsError from "./StatsError";
import StreakCard from "./StreakCard";
import { CardsBreakdown, LessonStatusTiles, PeriodActivityTiles } from "./SummaryCards";

/** Học viên chưa có hoạt động nào: hiện lời mời bắt đầu bên cạnh các số 0 (AC-TH-05). */
function isBrandNew(o: StatsOverview): boolean {
  const { cards } = o.vocab;
  return (
    o.streak.longest === 0 &&
    o.sentences.total === 0 &&
    o.lessons.doing + o.lessons.done === 0 &&
    cards.newCount + cards.learning + cards.reviewing + cards.mastered === 0 &&
    o.vocab.answered === 0
  );
}

/**
 * Khu vực Thống kê học tập (UC-TH-01) kèm Lịch sử luyện tập (UC-TH-02), nằm bên dưới phần Ôn tập trên trang Hôm nay.
 * Tách rõ 2 phần để tránh hiểu lầm bộ lọc thời gian:
 * 1) Tiến độ tổng thể (hiện trạng / 90 ngày: chuỗi, bài học, thẻ từ vựng, lịch học 90 ngày).
 * 2) Hoạt động theo khoảng thời gian (đặt bộ lọc 7 ngày / 30 ngày / Toàn bộ ngay đầu khối: số câu, tỷ lệ đúng từ vựng, lịch sử).
 */
export default function StatsDashboard() {
  const { t } = useTranslation("stats");
  const [range, setRange] = useRangeParam();
  const query = useStatsOverview(range);
  const data = query.data;

  return (
    <section className="flex w-full flex-col gap-8" id="v-stats" aria-labelledby="stats-title">
      {/* ── Phần 1: Tiến độ tổng thể (không phụ thuộc bộ lọc 7d/30d/all) ── */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-6">
          <div>
            <h2 id="stats-title" className="font-display text-xl font-bold">
              {t("overview.title")}
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">{t("overview.sub")}</p>
          </div>
        </div>

        <Link
          to="/student/weakness"
          className="group flex flex-wrap items-center justify-between gap-4 rounded-lg border border-fn-weakness/35 bg-fn-weakness-soft/60 p-4 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:border-fn-weakness hover:bg-fn-weakness-soft"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface text-fn-weakness">
              <Icon name="target" className="text-xl" />
            </span>
            <div className="min-w-0">
              <b className="block font-display text-base font-bold text-text">{t("overview.weaknessTitle")}</b>
              <span className="mt-0.5 block text-[13px] text-text-muted">{t("overview.weaknessSub")}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface px-3.5 py-2 text-xs font-semibold text-fn-weakness transition-colors group-hover:bg-fn-weakness group-hover:text-white">
            {t("overview.weaknessLink")}
            <Icon name="arrow-right" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </Link>

        {query.isError && !data ? (
          <StatsError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : !data ? (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]" aria-busy="true">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {isBrandNew(data) && (
              <div className="rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
                <EmptyState icon="sparkles" title={t("empty.title")} description={t("empty.desc")}>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <Link to="/student/lessons" className={buttonClasses({ variant: "primary" })}>
                      {t("empty.lessons")}
                    </Link>
                    <Link to="/student/vocab" className={buttonClasses({ variant: "secondary" })}>
                      {t("empty.vocab")}
                    </Link>
                  </div>
                </EmptyState>
              </div>
            )}
            <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]" aria-busy={query.isFetching}>
              <StreakCard streak={data.streak} />
              <div className="flex min-w-0 flex-col gap-5">
                <LessonStatusTiles lessons={data.lessons} />
                <CardsBreakdown cards={data.vocab.cards} />
              </div>
            </div>
          </>
        )}

        <ActivityHeatmap longestStreak={data?.streak.longest} />
      </div>

      {/* ── Phần 2: Hoạt động theo khoảng thời gian (chịu ảnh hưởng bởi 7 ngày / 30 ngày / Toàn bộ) ── */}
      <div className="flex flex-col gap-5 border-t border-border pt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">{t("overview.periodTitle")}</h2>
            <p className="mt-0.5 text-sm text-text-muted">{t("overview.periodSub")}</p>
          </div>
          <RangeTabs value={range} onChange={setRange} />
        </div>

        {data ? (
          <div aria-busy={query.isFetching}>
            <PeriodActivityTiles overview={data} />
          </div>
        ) : !query.isError ? (
          <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ) : null}

        <HistorySection range={range} onRangeChange={setRange} />
      </div>
    </section>
  );
}
