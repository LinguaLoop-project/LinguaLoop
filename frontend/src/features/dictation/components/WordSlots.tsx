import { useTranslation } from "react-i18next";

export interface WordSlotsProps {
  /** Độ dài từng từ của câu (từ `GET prompt?level=normal`). */
  lengths: number[];
  /** Chữ đang gõ; chỉ để hiện vào ô theo thứ tự, không phán đúng sai (việc chấm do backend). */
  typed: string;
}

const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/** Các ô báo độ dài từng từ của mức Normal (`slotHtml` của mockup): từ gõ rồi hiện chữ, chưa gõ hiện `*`. */
export default function WordSlots({ lengths, typed }: WordSlotsProps) {
  const { t } = useTranslation("dictation");
  const typedWords = typed
    .split(/\s+/)
    .map((w) => w.replace(EDGE_PUNCTUATION, ""))
    .filter(Boolean);
  return (
    <div role="group" aria-label={t("input.slots")} className="mt-3.5 flex flex-wrap gap-x-2 gap-y-1.5">
      {lengths.map((length, k) => {
        const word = typedWords[k];
        return (
          <span
            key={k}
            style={{ minWidth: `${Math.max(2.4, length * 0.62 + 1.2).toFixed(1)}em` }}
            className={`inline-flex h-[34px] items-center justify-center rounded-sm border px-2 text-[15px] font-semibold transition-colors duration-150 ${
              word
                ? "border-fn-dictation bg-fn-dictation-soft text-text"
                : "border-border-strong bg-bg-elevated tracking-[0.06em] text-text-subtle"
            }`}
          >
            {word ?? "*".repeat(length)}
          </span>
        );
      })}
    </div>
  );
}
