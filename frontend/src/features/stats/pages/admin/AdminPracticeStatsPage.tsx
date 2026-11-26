import { useState } from "react";
import { useTranslation } from "react-i18next";
import ErrorState from "@/components/common/ErrorState";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import type { AdminApiError } from "@/features/user";
import LineChart from "../../components/LineChart";
import { Delta, Panel, RankedList, StatsHeader, StatTile } from "../../components/StatsBits";
import { usePracticeStats } from "../../hooks";
import { DEFAULT_STATS_PERIOD, formatDecimal, formatInt, formatPct, isEmptySeries } from "../../statsFormat";
import type { Metric, PlanFilter, StatsPeriod } from "../../types";

const PLANS: readonly PlanFilter[] = ["ALL", "FREE", "PRO"];
const SERIES = [
  { key: "dictation", color: "--chart-1" },
  { key: "shadowing", color: "--chart-2" },
  { key: "review", color: "--chart-3" },
] as const;

/**
 * Thống kê luyện tập (UC-NK-03): chỉ số kèm mức tăng giảm so với kỳ trước, số lượt theo ngày của nghe chép, shadowing,
 * ôn thẻ, và hai danh sách xếp hạng; lọc theo khoảng và gói của học viên tại thời điểm luyện (BR-NK-12).
 */
export default function AdminPracticeStatsPage() {
  const { t, i18n } = useTranslation("statsAdmin");
  const language = i18n.language;
  const [period, setPeriod] = useState<StatsPeriod>(DEFAULT_STATS_PERIOD);
  const [plan, setPlan] = useState<PlanFilter>("ALL");
  const query = usePracticeStats(period, plan);
  const data = query.data;
  const int = (value: number) => formatInt(value, language);
  const count = (metric: Metric) => int(metric.current ?? 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <StatsHeader title={t("practice.title")} computedAt={data?.computedAt} period={period} onPeriod={setPeriod}>
        <SegmentedControl
          ariaLabel={t("practice.plan")}
          options={PLANS.map((p) => ({ value: p, label: t(`plans.${p}`) }))}
          value={plan}
          onChange={(p) => setPlan(p as PlanFilter)}
        />
      </StatsHeader>

      {query.isLoading && <Skeleton className="h-96 w-full" />}
      {query.isError && !data && (
        <ErrorState
          title={t("loadError")}
          kind={(query.error as unknown as AdminApiError | null)?.kind === "network" ? "network" : "server"}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}

      {data && (
        <div className={`flex flex-col gap-5 transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label={t("practice.learners")} value={count(data.learners)} sub={<Delta metric={data.learners} />} />
            <StatTile label={t("practice.dictation")} value={count(data.dictationAttempts)} sub={<Delta metric={data.dictationAttempts} />} />
            <StatTile label={t("practice.shadowing")} value={count(data.shadowingAttempts)} sub={<Delta metric={data.shadowingAttempts} />} />
            <StatTile label={t("practice.reviews")} value={count(data.reviews)} sub={<Delta metric={data.reviews} />} />
            <StatTile
              label={t("practice.lessonsCompleted")}
              value={count(data.lessonsCompleted)}
              sub={<Delta metric={data.lessonsCompleted} />}
            />
            <StatTile
              label={t("practice.dictationAvg")}
              value={formatDecimal(data.dictationAvgScore.current, language)}
              sub={<Delta metric={data.dictationAvgScore} />}
            />
            <StatTile
              label={t("practice.shadowingAvg")}
              value={formatDecimal(data.shadowingAvgScore.current, language)}
              sub={<Delta metric={data.shadowingAvgScore} />}
            />
            <StatTile
              label={t("practice.correctRate")}
              value={formatPct(data.correctRatePct.current, language)}
              sub={<Delta metric={data.correctRatePct} />}
            />
          </div>

          <Panel title={t("practice.dailyChart")}>
            <LineChart
              days={data.daily.days}
              series={SERIES.map((s) => ({
                key: s.key,
                label: t(`practice.series.${s.key}`),
                values: data.daily.series[s.key] ?? [],
                color: s.color,
              }))}
              format={int}
              ariaLabel={t("practice.dailyChart")}
              emptyText={isEmptySeries(data.daily) ? t("empty") : undefined}
            />
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title={t("practice.topLessons")}>
              <RankedList
                items={data.topLessons}
                unit={(value) => t("practice.attempts", { count: value, value: int(value) })}
                emptyText={t("empty")}
                to={(id) => `/admin/lessons/${id}`}
              />
            </Panel>
            <Panel title={t("practice.topDecks")}>
              <RankedList
                items={data.topDecks}
                unit={(value) => t("practice.learnersUnit", { count: value, value: int(value) })}
                emptyText={t("empty")}
                to={(id) => `/admin/decks/${id}`}
              />
            </Panel>
          </div>
        </div>
      )}
    </main>
  );
}
