import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import LineChart from "../../components/LineChart";
import { Delta, Panel, StatsHeader, StatTile } from "../../components/StatsBits";
import { RankList, StatsLoadError } from "../../components/TeacherStatsBits";
import { useTeacherOverviewStats } from "../../hooks";
import { DEFAULT_STATS_PERIOD, formatDecimal, formatInt, formatPct, isEmptySeries } from "../../statsFormat";
import type { StatsPeriod } from "../../types";

const SERIES = [
  { key: "dictation", color: "--chart-1" },
  { key: "shadowing", color: "--chart-2" },
  { key: "review", color: "--chart-3" },
] as const;

/**
 * Tổng quan thống kê nội dung của giáo viên (UC-TN-01): số lượng nội dung, lượt luyện so với kỳ trước, học viên đã học,
 * báo cáo đang mở, lượt theo ngày và hai danh sách xếp hạng tối đa 5 mục (BR-TN-04), theo khoảng 7, 30 hoặc 90 ngày.
 */
export default function TeacherOverviewPage() {
  const { t, i18n } = useTranslation("statsTeacher");
  const language = i18n.language;
  const navigate = useNavigate();
  const [period, setPeriod] = useState<StatsPeriod>(DEFAULT_STATS_PERIOD);
  const query = useTeacherOverviewStats(period);
  const data = query.data;
  const int = (value: number) => formatInt(value, language);
  const score = (value: number | null) => (value === null ? t("noScore") : formatDecimal(value, language));

  if (data && Object.values(data.content).every((count) => count === 0)) {
    // Chưa tạo nội dung nào: không hiện số liệu (UC-TN-01 nhánh 2a).
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
        <h1 className="text-2xl font-bold text-text">{t("overview.title")}</h1>
        <EmptyState title={t("overview.noContent")} description={t("overview.noContentDesc")}>
          <div className="flex flex-wrap justify-center gap-2">
            <Button leftIcon={<Icon name="plus" />} onClick={() => navigate("/teacher/lessons")}>
              {t("overview.createLesson")}
            </Button>
            <Button variant="secondary" leftIcon={<Icon name="plus" />} onClick={() => navigate("/teacher/decks/new")}>
              {t("overview.createDeck")}
            </Button>
          </div>
        </EmptyState>
      </main>
    );
  }

  const noActivity = data !== undefined && isEmptySeries(data.daily);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <StatsHeader title={t("overview.title")} computedAt={data?.computedAt} period={period} onPeriod={setPeriod} />

      {query.isLoading && <Skeleton className="h-96 w-full" />}
      {query.isError && !data && (
        <StatsLoadError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      )}

      {data && (
        <div className={`flex flex-col gap-5 transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label={t("overview.content")}
              value={t("overview.contentValue", {
                lessons: int(data.content.publishedLessons + data.content.draftLessons),
                decks: int(data.content.publishedDecks + data.content.draftDecks),
              })}
              sub={
                <span className="text-xs text-text-muted">
                  {t("overview.contentDraft", { lessons: int(data.content.draftLessons), decks: int(data.content.draftDecks) })}
                </span>
              }
            />
            <StatTile
              label={t("overview.attempts")}
              value={int(data.practiceAttempts.current ?? 0)}
              sub={<Delta metric={data.practiceAttempts} />}
            />
            <StatTile label={t("overview.learners")} value={int(data.learners)} />
            <StatTile
              label={t("overview.openReports")}
              value={int(data.openReports)}
              sub={
                data.openReports > 0 ? (
                  <Link to="/teacher/reports" className="text-xs font-semibold text-primary-text hover:underline">
                    {t("overview.viewReports")}
                  </Link>
                ) : undefined
              }
            />
          </div>

          <Panel title={t("overview.dailyChart")}>
            <LineChart
              days={data.daily.days}
              series={SERIES.map((s) => ({
                key: s.key,
                label: t(`overview.series.${s.key}`),
                values: data.daily.series[s.key] ?? [],
                color: s.color,
              }))}
              format={int}
              ariaLabel={t("overview.dailyChart")}
              emptyText={noActivity ? t("empty") : undefined}
            />
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title={t("overview.topLessons")}>
              <RankList
                emptyText={t("empty")}
                items={data.topLessons.map((l) => ({
                  id: l.id,
                  to: `/teacher/lessons/${l.id}/stats`,
                  name: l.title,
                  meta: t("overview.lessonMeta", {
                    attempts: int(l.attempts),
                    dictation: score(l.dictationAvgScore),
                    shadowing: score(l.shadowingAvgScore),
                  }),
                  value: t("overview.learnersUnit", { value: int(l.learners) }),
                }))}
              />
            </Panel>
            <Panel title={t("overview.topDecks")}>
              <RankList
                emptyText={t("empty")}
                items={data.topDecks.map((d) => ({
                  id: d.id,
                  to: `/teacher/decks/${d.id}/stats`,
                  name: d.name,
                  meta: t("overview.deckMeta", { reviews: int(d.reviews), pct: formatPct(d.correctRatePct, language) }),
                  value: t("overview.learnersUnit", { value: int(d.learners) }),
                }))}
              />
            </Panel>
          </div>
        </div>
      )}
    </main>
  );
}
