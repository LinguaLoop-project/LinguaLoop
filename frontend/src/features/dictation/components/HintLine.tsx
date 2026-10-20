import { useTranslation } from "react-i18next";
import type { HardHint } from "../types";

export interface HintLineProps {
  hint: HardHint;
  /** Độ dài từng từ của câu (từ đề Normal) để che các từ còn lại bằng dấu `*`; chưa có thì chưa hiện phần che. */
  lengths: number[] | null;
}

/** Gợi ý của mức Hard, hiện bên dưới ô gõ: phần đã đúng, từ vừa lộ (xanh) và các từ còn lại bị che. Không sửa chữ của người dùng. */
export default function HintLine({ hint, lengths }: HintLineProps) {
  const { t } = useTranslation("dictation");
  const masked = lengths?.slice(hint.index + 1).map((length) => "*".repeat(length)) ?? [];
  return (
    <div aria-live="polite" className="mt-3 rounded-lg bg-surface-hover px-4 py-3">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">{t("input.hintLabel")}</div>
      <p className="break-words text-lg leading-relaxed">
        {hint.prefix.map((word, i) => (
          <span key={i}>{word} </span>
        ))}
        <b className="text-success">{hint.word}</b>
        {masked.length > 0 && <span className="tracking-wider text-text-muted"> {masked.join(" ")}</span>}
      </p>
    </div>
  );
}
