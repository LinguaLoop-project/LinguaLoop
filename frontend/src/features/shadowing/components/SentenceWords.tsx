import { useTranslation } from "react-i18next";
import type { WordResult } from "../types";
import { TONE_TEXT, alignWords, toneOf } from "../utils";

export interface SentenceWordsProps {
  text: string;
  /** Rỗng khi câu chưa được chấm. */
  words: WordResult[];
  selected: number | null;
  onSelect: (position: number) => void;
}

/** Chữ của câu; sau khi chấm, mỗi từ tô theo điểm và bấm được để xem từng âm. */
export default function SentenceWords({ text, words, selected, onSelect }: SentenceWordsProps) {
  const { t } = useTranslation("pages");
  const display = alignWords(text, words);

  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-2 font-display text-2xl leading-snug md:text-3xl">
      {display.map((d) => {
        const r = d.result;
        if (!r) {
          return (
            <span key={d.key} className="text-text">
              {d.text}
            </span>
          );
        }
        if (r.outcome === "inserted") {
          return (
            <span
              key={d.key}
              title={t("student.shadowingPractice.word.inserted")}
              className="rounded-sm border border-dashed border-warning/60 px-1.5 text-base text-warning"
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
            title={omitted ? t("student.shadowingPractice.word.omitted") : `${Math.round(r.accuracy)}`}
            onClick={() => onSelect(r.position)}
            className={`cursor-pointer rounded-sm border-0 px-1 underline decoration-2 underline-offset-[6px] transition-colors hover:bg-primary-soft ${
              TONE_TEXT[tone]
            } ${omitted ? "line-through opacity-80" : ""} ${isSelected ? "bg-primary-soft" : "bg-transparent"}`}
          >
            {d.text}
          </button>
        );
      })}
    </p>
  );
}
