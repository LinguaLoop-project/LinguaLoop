import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import ProgressRing from "@/components/common/ProgressRing";
import type { StatsOverview } from "../types";
import { percentOf } from "../utils";
import DeltaBadge from "./DeltaBadge";

const CARD = "rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";
const OVERLINE = "text-xs font-bold uppercase tracking-wider";

function Tile({
  label,
  value,
  hint,
  tone,
  extra,
}: {
  label: string;
  value: number;
  hint: string;
  tone: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className={`${OVERLINE} ${tone}`}>{label}</span>
      <span className="font-display text-[30px] font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[13px] text-text-muted">{hint}</span>
      {extra}
    </div>
  );
}

/** Số bài đang học và đã xong (hiện trạng toàn thời gian, không phụ thuộc bộ lọc khoảng). */
export function LessonStatusTiles({ lessons }: { lessons: StatsOverview["lessons"] }) {
  const { t } = useTranslation("stats");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Tile label={t("summary.lessonsDoing")} value={lessons.doing} hint={t("summary.lessonsHint")} tone="text-fn-dictation" />
      <Tile label={t("summary.lessonsDone")} value={lessons.done} hint={t("summary.lessonsHint")} tone="text-success" />
    </div>
  );
}

/** Số câu đã luyện và tỷ lệ trả lời đúng từ vựng (thay đổi theo khoảng 7 ngày / 30 ngày / Toàn bộ). */
export function PeriodActivityTiles({ overview }: { overview: StatsOverview }) {
  const { t } = useTranslation("stats");
  const { sentences, vocab, comparison } = overview;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Tile
        label={t("summary.sentences")}
        value={sentences.total}
        hint={t("summary.sentencesSplit", { dictation: sentences.dictation, shadowing: sentences.shadowing })}
        tone="text-primary-text"
        extra={comparison && <DeltaBadge delta={comparison.sentencesDelta} range={overview.range} />}
      />
      <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <ProgressRing
          value={vocab.accuracyPercent ?? 0}
          size={72}
          tone="vocab"
          label="%"
          ariaLabel={t("summary.accuracyAria")}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className={`${OVERLINE} text-fn-vocab`}>{t("summary.accuracy")}</span>
          <span className="text-[13px] text-text-muted">
            {vocab.accuracyPercent === null
              ? t("summary.accuracyNone")
              : t("summary.accuracyHint", { correct: vocab.correct, answered: vocab.answered })}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Số câu đã luyện (theo khoảng), bài đang học và đã xong (hiện trạng), tỷ lệ trả lời đúng từ vựng (theo khoảng). */
export function SummaryTiles({ overview }: { overview: StatsOverview }) {
  return (
    <div className="flex flex-col gap-4">
      <PeriodActivityTiles overview={overview} />
      <LessonStatusTiles lessons={overview.lessons} />
    </div>
  );
}

const CARD_STATES = [
  { key: "new", field: "newCount", bar: "bg-border-strong" },
  { key: "learning", field: "learning", bar: "bg-warning" },
  { key: "reviewing", field: "reviewing", bar: "bg-info" },
  { key: "mastered", field: "mastered", bar: "bg-success" },
] as const;

/** Số thẻ theo bốn Trạng thái thẻ trong các bộ đã bắt đầu học (BR-TH-04). */
export function CardsBreakdown({ cards }: { cards: StatsOverview["vocab"]["cards"] }) {
  const { t } = useTranslation("stats");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const total = cards.newCount + cards.learning + cards.reviewing + cards.mastered;
  const masteredPct = percentOf(cards.mastered, total);

  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={`${OVERLINE} text-fn-vocab`}>{t("cards.title")}</h2>
        <div className="flex items-center gap-2">
          {total > 0 && <Badge tone="success">{t("cards.masteredPct", { percent: masteredPct })}</Badge>}
          <span className="text-[13px] font-medium text-text-muted">{t("cards.total", { count: total })}</span>
        </div>
      </div>
      <p className="mt-1 text-[13px] text-text-muted">{t("cards.hint")}</p>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-bg-elevated p-0.5" aria-hidden="true">
        {CARD_STATES.map(({ key, field, bar }) =>
          cards[field] > 0 ? (
            <span
              key={key}
              className={`h-full transition-all duration-200 first:rounded-l-full last:rounded-r-full ${bar} ${
                hoveredKey && hoveredKey !== key ? "opacity-30" : "opacity-100"
              }`}
              style={{ width: `${(cards[field] * 100) / total}%` }}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {CARD_STATES.map(({ key, field, bar }) => {
          const pct = percentOf(cards[field], total);
          const isHovered = hoveredKey === key;
          return (
            <li
              key={key}
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`flex flex-col gap-1 rounded-md border px-3 py-2 transition-colors ${
                isHovered ? "border-border-strong bg-surface-hover" : "border-border/60 bg-bg-elevated/60"
              }`}
            >
              <span className="flex items-center justify-between gap-1.5 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${bar}`} aria-hidden="true" />
                  {t(`cards.${key}`)}
                </span>
                {total > 0 && <span className="text-[11px] tabular-nums text-text-subtle">{pct}%</span>}
              </span>
              <span className="font-display text-2xl font-bold tabular-nums">{cards[field]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
