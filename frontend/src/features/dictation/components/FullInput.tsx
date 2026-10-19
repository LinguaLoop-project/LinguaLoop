import { useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { Kbd } from "./ShortcutsPopover";
import WordSlots from "./WordSlots";

export interface FullInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Enter (không Shift) hoặc bấm nút Kiểm tra. */
  onSubmit: () => void;
  submitting: boolean;
  /** Độ dài từng từ; có thì hiện các ô (Normal), không có thì không gợi ý gì (Hard). */
  slotLengths: number[] | null;
}

/** Ô gõ cả câu cho Normal/Hard (`.dc-input` + `#dSlots` của mockup). */
export default function FullInput({ value, onChange, onSubmit, submitting, slotLengths }: FullInputProps) {
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
      {slotLengths && <WordSlots lengths={slotLengths} typed={value} />}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
          <Kbd>Enter</Kbd> {t("input.enterHint")}
        </span>
        <span className="grow" />
        <Button onClick={onSubmit} isLoading={submitting}>
          {t("input.submit")}
        </Button>
      </div>
    </div>
  );
}
