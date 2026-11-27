import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Badge from "@/components/common/Badge";
import ProgressBar from "@/components/common/ProgressBar";
import Skeleton from "@/components/common/Skeleton";
import LineChart from "../../components/LineChart";
import { Panel, StatsHeader, StatTile } from "../../components/StatsBits";
import { BackButton, ForbiddenState, RankList, StatsLoadError } from "../../components/TeacherStatsBits";
import { useTeacherLessonStats } from "../../hooks";
import { DEFAULT_STATS_PERIOD, formatDecimal, formatInt, formatPct, isEmptySeries } from "../../statsFormat";
import type { StatsPeriod, TeacherHardSentence } from "../../types";
import { useContentAccessError } from "../../useContentAccessError";

const LESSONS_PATH = "/teacher/lessons";
const SERIES = [
  { key: "dictation", color: "--chart-1" },
  { key: "shadowing", color: "--chart-2" },
] as const;

/**
 * Thống kê một bài học của giáo viên (UC-TN-02): tiến độ học viên, lượt và điểm trung bình hai chế độ, lượt luyện mỗi
 * ngày, và 5 câu khó nhất của từng chế độ (BR-TN-04).
 */
export default function TeacherLessonStatsPage() {
  const { t, i18n } = useTranslation("statsTeacher");
  const language = i18n.language;
  const { id = "" } = useParams();
  const [period, setPeriod] = useState<StatsPeriod>(DEFAULT_STATS_PERIOD);
  const query = useTeacherLessonStats(id, period);
  const data = query.data;
  const access = useContentAccessError(query.error, { path: LESSONS_PATH, message: t("lesson.notFound") });
  const int = (value: number) => formatInt(value, language);
  const score = (value: number | null) => (value === null ? t("noScore") : formatDecimal(value, language));
  const hardItems = (rows: readonly TeacherHardSentence[]) =>
    rows.map((row) => ({
      id: row.id,
      name: row.text,
      meta: t("lesson.hardMeta", { order: row.order, attempts: int(row.attempts) }),
      value: t("lesson.scoreUnit", { score: score(row.avgScore) }),
    }));

  if (access === "forbidden") {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
        <ForbiddenState title={t("lesson.forbidden")} fallback={LESSONS_PATH} />
      </main>
    );
  }

  const noData = data !== undefined && data.learnersStarted === 0 && data.dictationAttempts + data.shadowingAttempts === 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <BackButton fallback={LESSONS_PATH} />
      <StatsHeader
        title={data ? data.title : t("lesson.title")}
        computedAt={data?.computedAt}
        period={period}
        onPeriod={setPeriod}
      >
        {data && <Badge variant={data.status === "published" ? "success" : "default"}>{t(`status.${data.status}`)}</Badge>}
      </StatsHeader>

      {query.isLoading && <Skeleton className="h-96 w-full" />}
      {query.isError && !data && access === null && (
        // Mất kết nối: không hiện số liệu cũ (AC-TN-15).
        <StatsLoadError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      )}

      {data && (
        <div className={`flex flex-col gap-5 transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
          {noData && (
            <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">{t("empty")}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label={t("lesson.started")} value={int(data.learnersStarted)} />
            <StatTile
              label={t("lesson.completed")}
              value={int(data.learnersCompleted)}
              sub={<CompletionBar pct={data.completionRatePct} label={t("lesson.completionRate", { pct: formatPct(data.completionRatePct, language) })} />}
            />
            <StatTile
              label={t("lesson.dictation")}
              value={int(data.dictationAttempts)}
              sub={<Avg>{t("lesson.avg", { score: score(data.dictationAvgScore) })}</Avg>}
            />
            <StatTile
              label={t("lesson.shadowing")}
              value={int(data.shadowingAttempts)}
              sub={<Avg>{t("lesson.avg", { score: score(data.shadowingAvgScore) })}</Avg>}
            />
          </div>

          <Panel title={t("lesson.dailyChart")}>
            <LineChart
              days={data.daily.days}
              series={SERIES.map((s) => ({
                key: s.key,
                label: t(`lesson.series.${s.key}`),
                values: data.daily.series[s.key] ?? [],
                color: s.color,
              }))}
              format={int}
              ariaLabel={t("lesson.dailyChart")}
              emptyText={isEmptySeries(data.daily) ? t("empty") : undefined}
            />
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title={t("lesson.hardestDictation")}>
              <RankList items={hardItems(data.hardestDictation)} emptyText={t("notRanked")} />
            </Panel>
            <Panel title={t("lesson.hardestShadowing")}>
              <RankList items={hardItems(data.hardestShadowing)} emptyText={t("notRanked")} />
            </Panel>
          </div>
        </div>
      )}
    </main>
  );
}

function Avg({ children }: Readonly<{ children: string }>) {
  return <span className="text-xs text-text-muted">{children}</span>;
}

/** Thanh tỷ lệ hoàn thành; trống khi chưa có học viên bắt đầu. */
function CompletionBar({ pct, label }: Readonly<{ pct: number | null; label: string }>) {
  return (
    <div className="flex flex-col gap-1">
      <ProgressBar value={pct ?? 0} label={label} tone="success" thin />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
