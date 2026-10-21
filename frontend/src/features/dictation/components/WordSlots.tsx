import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import type { RevealedWords } from "../types";

export interface WordSlot {
  /** Vị trí token của từ trong câu. */
  position: number;
  length: number;
}

export interface WordSlotsProps {
  /** Từng từ của câu, theo thứ tự (từ `GET prompt?level=normal`). */
  slots: WordSlot[];
  /** Chữ đang gõ; chỉ để hiện vào ô theo thứ tự, không phán đúng sai (việc chấm do backend). */
  typed: string;
  /** Các từ đã lộ: hiện chữ đúng ở ô của nó, còn chữ đã gõ chỉ lấp vào các ô còn lại. */
  revealed: RevealedWords;
  /** Đang chờ backend trả chữ của một ô. */
  revealing: boolean;
  onReveal: (position: number) => void;
}

const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/**
 * Các ô báo độ dài từng từ của mức Normal (`slotHtml` của mockup): từ gõ rồi hiện chữ, chưa gõ hiện `*`.
 * Con mắt phía trên mỗi ô lộ đúng từ ở vị trí đó (tính là sai khi nộp).
 */
export default function WordSlots({ slots, typed, revealed, revealing, onReveal }: WordSlotsProps) {
  const { t } = useTranslation("dictation");
  const typedWords = typed
    .split(/\s+/)
    .map((w) => w.replace(EDGE_PUNCTUATION, ""))
    .filter(Boolean);
  let next = 0;
  return (
    <div role="group" aria-label={t("input.slots")} className="mt-3.5 flex flex-wrap gap-x-2 gap-y-2">
      {slots.map(({ position, length }, k) => {
        const isRevealed = position in revealed;
        const word = isRevealed ? revealed[position] : typedWords[next++];
        return (
          <span key={position} className="inline-flex flex-col items-center">
            {isRevealed ? (
              <span className="h-7" />
            ) : (
              <button
                type="button"
                aria-label={t("input.revealSlot", { n: k + 1 })}
                title={t("input.revealSlot", { n: k + 1 })}
                disabled={revealing}
                onClick={() => onReveal(position)}
                className="inline-flex h-7 w-9 cursor-pointer items-center justify-center rounded-sm text-text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-text disabled:cursor-wait disabled:opacity-50"
              >
                <Icon name="eye" className="h-4 w-4" />
              </button>
            )}
            <span
              style={{ minWidth: `${Math.max(2.4, length * 0.62 + 1.2).toFixed(1)}em` }}
              title={isRevealed ? t("input.revealed") : undefined}
              className={`inline-flex h-[34px] items-center justify-center rounded-sm border px-2 text-[15px] font-semibold transition-colors duration-150 ${
                isRevealed
                  ? "border-dashed border-warning bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] text-warning"
                  : word
                    ? "border-fn-dictation bg-fn-dictation-soft text-text"
                    : "border-border-strong bg-bg-elevated tracking-[0.06em] text-text-subtle"
              }`}
            >
              {word ?? "*".repeat(length)}
            </span>
          </span>
        );
      })}
    </div>
  );
}
