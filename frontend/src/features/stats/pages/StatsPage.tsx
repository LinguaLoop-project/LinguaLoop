import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import ActivityHeatmap from "../components/ActivityHeatmap";
import HistorySection from "../components/HistorySection";
import RangeTabs from "../components/RangeTabs";
import StatsError from "../components/StatsError";
import StreakCard from "../components/StreakCard";
import { CardsBreakdown, SummaryTiles } from "../components/SummaryCards";
import { useStatsOverview } from "../hooks";
import type { StatsOverview } from "../types";
import { useRangeParam } from "../useRangeParam";

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

/** Trang Thống kê học tập (UC-TH-01) kèm Lịch sử luyện tập (UC-TH-02). Bảng lỗi và bản đồ âm vị nằm ở trang Điểm yếu. */
export default function StatsPage() {
  const { t } = useTranslation("stats");
  const [range, setRange] = useRangeParam();
  const query = useStatsOverview(range);
  const data = query.data;

  return (
    <section className="flex w-full flex-col gap-6" id="v-stats">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-text">{t("overview.overline")}</div>
          <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("overview.title")}</h1>
          <p className="mt-1 text-text-muted">{t("overview.sub")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/student/weakness" className={buttonClasses({ variant: "ghost", size: "sm" })}>
            <Icon name="target" />
            {t("overview.weaknessLink")}
          </Link>
          <RangeTabs value={range} onChange={setRange} />
        </div>
      </header>

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
            <div className="flex min-w-0 flex-col gap-6">
              <SummaryTiles overview={data} />
              <CardsBreakdown cards={data.vocab.cards} />
            </div>
          </div>
        </>
      )}

      <ActivityHeatmap />

      <HistorySection range={range} onRangeChange={setRange} />
    </section>
  );
}
