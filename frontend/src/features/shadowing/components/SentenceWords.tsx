import { useTranslation } from "react-i18next";
import type { WordResult } from "../types";
import { TONE_TEXT, alignWords, toneOf } from "../utils";

export interface SentenceWordsProps {
  text: string;
  /** Rỗng khi câu chưa được chấm. */
  words: WordResult[];
  /** Phiên âm từng từ theo thứ tự trong câu; null khi không có hoặc không khớp số từ. */
  ipa: string[] | null;
  /** Từ đang được đọc khi phát mẫu (thứ tự trong câu), -1 nếu không có. */
  lit: number;
  selected: number | null;
  onSelect: (position: number) => void;
}

const WORD_BASE =
  "inline-flex flex-col items-center gap-0.5 rounded-md border px-2 py-1 transition-colors duration-150";

/** Câu cần đọc: mỗi từ kèm phiên âm bên dưới; sau khi chấm, từ tô theo điểm và bấm được để xem từng âm. */
export default function SentenceWords({ text, words, ipa, lit, selected, onSelect }: SentenceWordsProps) {
  const { t } = useTranslation("pages");
  const display = alignWords(text, words);

  return (
    <div className="flex flex-wrap justify-center gap-x-2 gap-y-1.5 px-2 pb-1.5 pt-3">
      {display.map((d) => {
        const r = d.result;
        const phonetic = ipa && d.tokenIndex >= 0 ? ipa[d.tokenIndex] : null;
        const isLit = d.tokenIndex >= 0 && d.tokenIndex === lit;
        const ipaLine = phonetic ? (
          <span className="font-body text-[13px] font-medium text-text-muted">/{phonetic}/</span>
        ) : null;

        if (!r) {
          return (
            <span
              key={d.key}
              className={`${WORD_BASE} text-text ${isLit ? "border-fn-shadowing bg-fn-shadowing-soft" : "border-transparent"}`}
            >
              <span className="font-display text-[22px] font-bold leading-tight tracking-tight md:text-[26px]">{d.text}</span>
              {ipaLine}
            </span>
          );
        }

        if (r.outcome === "inserted") {
          return (
            <span
              key={d.key}
              title={t("student.shadowingPractice.word.insertedHint", { word: d.text })}
              className="self-start rounded-md border border-dashed border-warning/60 px-1.5 py-0.5 text-sm text-warning"
            >
              + {d.text}
            </span>
          );
        }

        const omitted = r.outcome === "omitted";
        const tone = omitted ? "bad" : toneOf(r.accuracy);
        const isSelected = selected === r.position;
        return (
          <button
            key={d.key}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${d.text}, ${omitted ? t("student.shadowingPractice.word.omitted") : Math.round(r.accuracy)}`}
            title={omitted ? t("student.shadowingPractice.word.omittedHint") : undefined}
            onClick={() => onSelect(r.position)}
            className={`${WORD_BASE} cursor-pointer bg-transparent hover:bg-surface-hover ${
              isSelected ? "border-border-strong bg-surface-hover" : isLit ? "border-fn-shadowing bg-fn-shadowing-soft" : "border-transparent"
            }`}
          >
            <span
              className={`font-display text-[22px] font-bold leading-tight tracking-tight md:text-[26px] ${TONE_TEXT[tone]} ${
                tone === "bad" ? "underline decoration-wavy underline-offset-[6px]" : ""
              } ${omitted ? "line-through opacity-80" : ""}`}
            >
              {d.text}
            </span>
            {ipaLine}
            <span className={`text-xs font-semibold tabular-nums ${TONE_TEXT[tone]}`} aria-hidden="true">
              {omitted ? "—" : Math.round(r.accuracy)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
