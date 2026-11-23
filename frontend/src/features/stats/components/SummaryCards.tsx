import { useTranslation } from "react-i18next";
import ProgressRing from "@/components/common/ProgressRing";
import type { StatsOverview } from "../types";

const CARD = "rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";
const OVERLINE = "text-xs font-bold uppercase tracking-wider";

function Tile({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className={`${OVERLINE} ${tone}`}>{label}</span>
      <span className="font-display text-[30px] font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[13px] text-text-muted">{hint}</span>
    </div>
  );
}

/** Số câu đã luyện (theo khoảng), bài đang học và đã xong (hiện trạng), tỷ lệ trả lời đúng từ vựng (theo khoảng). */
export function SummaryTiles({ overview }: { overview: StatsOverview }) {
  const { t } = useTranslation("stats");
  const { sentences, lessons, vocab } = overview;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Tile
        label={t("summary.sentences")}
        value={sentences.total}
        hint={t("summary.sentencesSplit", { dictation: sentences.dictation, shadowing: sentences.shadowing })}
        tone="text-primary-text"
      />
      <Tile label={t("summary.lessonsDoing")} value={lessons.doing} hint={t("summary.lessonsHint")} tone="text-fn-dictation" />
      <Tile label={t("summary.lessonsDone")} value={lessons.done} hint={t("summary.lessonsHint")} tone="text-success" />
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

const CARD_STATES = [
  { key: "new", field: "newCount", bar: "bg-border-strong" },
  { key: "learning", field: "learning", bar: "bg-warning" },
  { key: "reviewing", field: "reviewing", bar: "bg-info" },
  { key: "mastered", field: "mastered", bar: "bg-success" },
] as const;

/** Số thẻ theo bốn Trạng thái thẻ trong các bộ đã bắt đầu học (BR-TH-04). */
export function CardsBreakdown({ cards }: { cards: StatsOverview["vocab"]["cards"] }) {
  const { t } = useTranslation("stats");
  const total = cards.newCount + cards.learning + cards.reviewing + cards.mastered;
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={`${OVERLINE} text-fn-vocab`}>{t("cards.title")}</h2>
        <span className="text-[13px] text-text-muted">{t("cards.total", { count: total })}</span>
      </div>
      <p className="mt-1 text-[13px] text-text-muted">{t("cards.hint")}</p>

      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated" aria-hidden="true">
        {CARD_STATES.map(({ key, field, bar }) =>
          cards[field] > 0 ? <span key={key} className={bar} style={{ width: `${(cards[field] * 100) / total}%` }} /> : null,
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CARD_STATES.map(({ key, field, bar }) => (
          <li key={key} className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className={`size-2 rounded-full ${bar}`} aria-hidden="true" />
              {t(`cards.${key}`)}
            </span>
            <span className="font-display text-2xl font-bold tabular-nums">{cards[field]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
