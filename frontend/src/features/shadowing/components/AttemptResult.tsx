import { useTranslation } from "react-i18next";
import Mascot from "@/components/common/Mascot";
import type { SentenceRecord } from "../types";
import { TONE_TEXT, WORD_REVIEW_BELOW, toneOf } from "../utils";

export interface AttemptResultProps {
  record: SentenceRecord;
  selected: number | null;
  onSelectWord: (position: number) => void;
}

/** Điểm câu, các chỉ số và danh sách từ cần luyện thêm sau một Lượt shadowing. */
export default function AttemptResult({ record, selected, onSelectWord }: AttemptResultProps) {
  const { t } = useTranslation("pages");
  const k = "student.shadowingPractice";
  const tone = toneOf(record.score);
  const weakWords = record.words
    .filter((w) => w.outcome !== "inserted" && (w.outcome === "omitted" || w.accuracy < WORD_REVIEW_BELOW))
    .sort((a, b) => a.accuracy - b.accuracy);

  const metrics = [
    ["accuracy", record.accuracy],
    ["fluency", record.fluency],
    ["completeness", record.completeness],
    ["prosody", record.prosody],
  ] as const;

  return (
    <section aria-live="polite" className="flex flex-col gap-4 border-t border-border pt-5">
      <div className="flex flex-wrap items-center gap-5">
        <div className="text-center">
          <div className={`font-display text-5xl leading-none tabular-nums ${TONE_TEXT[tone]}`}>
            {Math.round(record.score)}
          </div>
          <div className="mt-1 text-xs text-text-muted">{t(`${k}.score`)}</div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Mascot mood={tone === "good" ? "correct" : "encourage"} size={56} alt="" />
          <div className="min-w-0">
            <p className="font-medium">{t(`${k}.verdict.${tone}`)}</p>
            <p className="text-sm text-text-muted">
              {t(`${k}.attemptInfo`, { count: record.count, best: Math.round(record.best) })}
            </p>
          </div>
        </div>
      </div>

      {record.accuracy !== null && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map(([key, value]) =>
            value === null ? null : (
              <div key={key} className="rounded-md border border-border bg-bg-elevated px-3 py-2">
                <dt className="text-xs text-text-muted">{t(`${k}.metrics.${key}`)}</dt>
                <dd className={`font-display text-xl tabular-nums ${TONE_TEXT[toneOf(value)]}`}>{Math.round(value)}</dd>
              </div>
            ),
          )}
        </dl>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">{t(`${k}.wordsToFix`)}</h3>
        {weakWords.length === 0 ? (
          <p className="text-sm text-text-muted">{t(`${k}.nothingToFix`, { score: WORD_REVIEW_BELOW })}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {weakWords.map((w) => (
              <li key={w.position}>
                <button
                  type="button"
                  aria-pressed={selected === w.position}
                  onClick={() => onSelectWord(w.position)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-sm hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary-soft"
                >
                  <b>{w.word}</b>
                  <span className={`tabular-nums ${TONE_TEXT[w.outcome === "omitted" ? "bad" : toneOf(w.accuracy)]}`}>
                    {Math.round(w.accuracy)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-text-subtle">{t(`${k}.word.clickHint`)}</p>
      </div>
    </section>
  );
}
