import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import LineChart from "../../components/LineChart";
import { Panel, StatsHeader, StatTile } from "../../components/StatsBits";
import { BackButton, ForbiddenState, RankList, StatsLoadError } from "../../components/TeacherStatsBits";
import { useTeacherDeckStats } from "../../hooks";
import { DEFAULT_STATS_PERIOD, formatInt, formatPct, isEmptySeries } from "../../statsFormat";
import type { StatsPeriod, TeacherDeckStats } from "../../types";
import { useContentAccessError } from "../../useContentAccessError";

const DECKS_PATH = "/teacher/decks";
const SERIES = [
  { key: "reviews", color: "--chart-1" },
  { key: "correct", color: "--chart-2" },
] as const;
const STATES = [
  { key: "new", field: "newPct", color: "--chart-4" },
  { key: "learning", field: "learningPct", color: "--chart-3" },
  { key: "reviewing", field: "reviewingPct", color: "--chart-2" },
  { key: "mastered", field: "masteredPct", color: "--chart-1" },
] as const;

/**
 * Thống kê một bộ thẻ của giáo viên (UC-TN-03): số học viên, lượt ôn, tỷ lệ trả lời đúng, lượt ôn mỗi ngày, tỷ lệ thẻ ở
 * từng trạng thái học, và 5 thẻ khó nhất của mỗi nhóm thẻ (BR-TN-04).
 */
export default function TeacherDeckStatsPage() {
  const { t, i18n } = useTranslation("statsTeacher");
  const language = i18n.language;
  const { id = "" } = useParams();
  const [period, setPeriod] = useState<StatsPeriod>(DEFAULT_STATS_PERIOD);
  const query = useTeacherDeckStats(id, period);
  const data = query.data;
  const access = useContentAccessError(query.error, { path: DECKS_PATH, message: t("deck.notFound") });
  const [groupId, setGroupId] = useState<string | null>(null);
  // Mặc định nhóm đầu tiên (UC-TN-03 Bước 3); nhóm đã chọn bị xóa thì quay về nhóm đầu.
  const selected = data?.groups.find((g) => g.id === groupId) ?? data?.groups[0];
  const int = (value: number) => formatInt(value, language);
  const pct = (value: number | null) => formatPct(value, language);

  if (access === "forbidden") {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
        <ForbiddenState title={t("deck.forbidden")} fallback={DECKS_PATH} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      <BackButton fallback={DECKS_PATH} />
      <StatsHeader title={data ? data.name : t("deck.title")} computedAt={data?.computedAt} period={period} onPeriod={setPeriod}>
        {data && <Badge variant={data.status === "published" ? "success" : "default"}>{t(`status.${data.status}`)}</Badge>}
      </StatsHeader>

      {query.isLoading && <Skeleton className="h-96 w-full" />}
      {query.isError && !data && access === null && (
        // Mất kết nối: không hiện số liệu cũ (AC-TN-23).
        <StatsLoadError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      )}

      {data && (
        <div className={`flex flex-col gap-5 transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
          {data.learners === 0 && (
            <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">{t("empty")}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label={t("deck.learners")} value={int(data.learners)} />
            <StatTile label={t("deck.reviews")} value={int(data.reviews)} />
            <StatTile label={t("deck.correctRate")} value={pct(data.correctRatePct)} />
          </div>

          <Panel title={t("deck.dailyChart")}>
            <LineChart
              days={data.daily.days}
              series={SERIES.map((s) => ({
                key: s.key,
                label: t(`deck.series.${s.key}`),
                values: data.daily.series[s.key] ?? [],
                color: s.color,
              }))}
              format={int}
              ariaLabel={t("deck.dailyChart")}
              emptyText={isEmptySeries(data.daily) ? t("empty") : undefined}
            />
          </Panel>

          <Panel title={t("deck.states")}>
            <StateBar states={data.cardStates} />
            <p className="text-xs text-text-subtle">{t("deck.statesHint")}</p>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Panel title={t("deck.groups")}>
              <ul className="flex flex-col gap-1">
                {data.groups.map((group) => (
                  <li key={group.id}>
                    <button
                      type="button"
                      aria-pressed={selected?.id === group.id}
                      onClick={() => setGroupId(group.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selected?.id === group.id ? "bg-primary-soft text-primary-text" : "text-text hover:bg-surface-hover"
                      }`}
                    >
                      <span className="truncate font-medium">{group.name}</span>
                      <Icon name="chevron-right" className="shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title={selected ? t("deck.hardest", { group: selected.name }) : t("deck.hardestNoGroup")}>
              <RankList
                emptyText={t("notRanked")}
                items={(selected?.hardestCards ?? []).map((card) => ({
                  id: card.id,
                  name: card.word,
                  meta: t("deck.reviewsUnit", { value: int(card.reviews) }),
                  value: t("deck.correctUnit", { pct: pct(card.correctRatePct) }),
                }))}
              />
            </Panel>
          </div>
        </div>
      )}
    </main>
  );
}

/** Thanh tỷ lệ bốn trạng thái học kèm chú thích; trống khi chưa có học viên nào ôn bộ. */
function StateBar({ states }: Readonly<{ states: TeacherDeckStats["cardStates"] }>) {
  const { t, i18n } = useTranslation("statsTeacher");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-elevated">
        {STATES.map((s) => (
          <div key={s.key} style={{ width: `${states[s.field] ?? 0}%`, background: `var(${s.color})` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {STATES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: `var(${s.color})` }} />
            <span className="text-text-muted">{t(`deck.state.${s.key}`)}</span>
            <span className="font-semibold text-text tabular-nums">{formatPct(states[s.field], i18n.language)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
