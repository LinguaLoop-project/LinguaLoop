import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import type { WordView } from "../types";
import { chipTone, normalizeWord, sentenceTokens } from "../utils";
import type { ChipTone } from "../utils";

const K = "student.tutor.chips";

const TONE_TEXT: Record<ChipTone, string> = {
  bad: "text-danger underline decoration-wavy underline-offset-[6px]",
  try: "text-info",
  ok: "text-success",
  warn: "text-warning",
  none: "text-text",
};

export interface WordChipsProps {
  sentence: string;
  words: WordView[];
  currentWord: string | null;
  /** Tắt bấm chọn từ (đang giữ nút đọc, đang chờ chấm, hoặc phiên đã xong). */
  disabled: boolean;
  maxAttempts: number;
  onChoose: (word: string) => void;
}

/** Câu thành các chip từ bấm được: từ còn lỗi, từ đã đạt, từ đang luyện và số lượt chấm ●●○. */
export default function WordChips({ sentence, words, currentWord, disabled, maxAttempts, onChoose }: WordChipsProps) {
  const { t } = useTranslation("pages");
  const byKey = new Map(words.map((w) => [normalizeWord(w.word), w]));
  const currentKey = currentWord ? normalizeWord(currentWord) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t(`${K}.label`)}>
        {sentenceTokens(sentence).map((token, index) => {
          const view = byKey.get(token.key);
          const tone = chipTone(view);
          const isCurrent = token.key === currentKey;
          return (
            <button
              key={`${token.key}-${index}`}
              type="button"
              disabled={disabled}
              aria-pressed={isCurrent}
              onClick={() => onChoose(token.text)}
              title={
                view
                  ? t(`${K}.title`, { n: view.attempts, best: view.best !== undefined ? Math.round(view.best) : "—" })
                  : t(`${K}.pick`)
              }
              className={`inline-flex flex-col items-center gap-1 rounded-md border px-2.5 py-1 transition-colors duration-150 disabled:cursor-default ${
                isCurrent ? "border-2 border-text bg-surface-hover px-[9px] py-[3px]" : "border-border"
              } ${disabled ? "" : "cursor-pointer hover:bg-surface-hover"}`}
            >
              <span className={`font-display text-xl font-bold leading-tight ${TONE_TEXT[tone]}`}>
                {token.text}
                {tone === "ok" && <Icon name="check" className="ml-1 align-[-2px] text-base" />}
                {tone === "warn" && <Icon name="rotate-cw" className="ml-1 align-[-2px] text-base" />}
              </span>
              {view && (
                <span className="inline-flex gap-1" aria-hidden>
                  {Array.from({ length: maxAttempts }, (_, i) => (
                    <i
                      key={i}
                      className={`h-2 w-2 rounded-full border-[1.5px] ${
                        i < view.attempts ? "border-fn-shadowing bg-fn-shadowing" : "border-text-muted"
                      }`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-text-subtle">{t(`${K}.legend`)}</p>
    </div>
  );
}
