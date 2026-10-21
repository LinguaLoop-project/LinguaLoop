import { useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { HardHint, RevealedWords } from "../types";
import HintLine from "./HintLine";
import InputActions from "./InputActions";
import WordSlots, { type WordSlot } from "./WordSlots";

export interface FullInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Enter (không Shift) hoặc bấm nút Kiểm tra. */
  onSubmit: () => void;
  /** Bấm "Hiện cả câu": nộp lượt bỏ cuộc. */
  onGiveUp: () => void;
  submitting: boolean;
  /** Từng từ của câu; có thì hiện các ô kèm con mắt lộ từ (Normal), không có thì không có ô (Hard). */
  slots: WordSlot[] | null;
  revealed: RevealedWords;
  /** Đang chờ backend trả một từ bị lộ. */
  revealing: boolean;
  /** Lộ từ ở vị trí `position` (con mắt của ô, Normal). */
  onReveal: (position: number) => void;
  /** Lộ từ đúng kế tiếp trong chữ đã gõ (nút Gợi ý, Hard). */
  onHint: () => void;
  /** Gợi ý gần nhất của Hard, hiện bên dưới ô gõ. */
  hint: HardHint | null;
  hintLengths: number[] | null;
}

/** Ô gõ cả câu cho Normal/Hard (`.dc-input` + `#dSlots` của mockup). */
export default function FullInput({
  value,
  onChange,
  onSubmit,
  onGiveUp,
  submitting,
  slots,
  revealed,
  revealing,
  onReveal,
  onHint,
  hint,
  hintLengths,
}: FullInputProps) {
  const { t } = useTranslation("dictation");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter đang chọn chữ của bộ gõ (tiếng Việt, tiếng Nhật...) thì không phải lệnh nộp.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div>
      <label htmlFor="dictation-input" className="sr-only">
        {t("input.label")}
      </label>
      <textarea
        id="dictation-input"
        ref={inputRef}
        value={value}
        rows={3}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        placeholder={t("input.placeholder")}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="block min-h-[88px] w-full resize-none rounded-lg border border-border-strong bg-bg-base px-4 py-3 text-xl font-medium leading-normal transition-[border-color,box-shadow] duration-200 placeholder:text-text-subtle focus:border-fn-dictation focus:outline-none focus:shadow-[0_0_0_4px_var(--fn-dictation-soft)]"
      />
      {!slots && hint && <HintLine hint={hint} lengths={hintLengths} />}
      {slots && <WordSlots slots={slots} typed={value} revealed={revealed} revealing={revealing} onReveal={onReveal} />}
      <InputActions
        submitting={submitting}
        onHint={slots ? undefined : onHint}
        hinting={revealing}
        onSubmit={onSubmit}
        onGiveUp={onGiveUp}
      />
    </div>
  );
}
