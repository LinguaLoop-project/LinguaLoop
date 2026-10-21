import { useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import type { PromptToken, RevealedWords } from "../types";
import InputActions from "./InputActions";

export interface ClozeInputProps {
  /** Đề Easy: từ hiện sẵn có `display`, ô trống chỉ có `position` và `length`. */
  tokens: PromptToken[];
  values: Record<number, string>;
  /** Các ô đã mở bằng con mắt: bị khóa và hiện chữ đúng (tính là sai khi nộp). */
  revealed: RevealedWords;
  /** Đang chờ backend trả chữ của một ô. */
  revealing: boolean;
  onChange: (position: number, value: string) => void;
  onReveal: (position: number) => void;
  onSubmit: () => void;
  onGiveUp: () => void;
  submitting: boolean;
}

/** Ô điền của mức Easy: câu với các ô trống, Space sang ô kế, Backspace ở ô trống về ô trước, Enter nộp. */
export default function ClozeInput({
  tokens,
  values,
  revealed,
  revealing,
  onChange,
  onReveal,
  onSubmit,
  onGiveUp,
  submitting,
}: ClozeInputProps) {
  const { t } = useTranslation("dictation");
  const inputs = useRef(new Map<number, HTMLInputElement>());
  const blanks = tokens.filter((token) => token.blank);

  /** Tìm ô đang mở gần nhất theo hướng `step` kể từ ô thứ `from` (bỏ qua ô đã khóa). */
  const focusFrom = (from: number, step: 1 | -1, atEnd = false): boolean => {
    for (let i = from + step; i >= 0 && i < blanks.length; i += step) {
      if (blanks[i].position in revealed) continue;
      const input = inputs.current.get(blanks[i].position);
      if (!input) continue;
      input.focus();
      if (atEnd) input.setSelectionRange(input.value.length, input.value.length);
      return true;
    }
    return false;
  };

  /** Xin chữ của ô rồi chuyển con trỏ sang ô còn lại gần nhất, vì nút con mắt biến mất cùng ô đó. */
  const reveal = (position: number, order: number) => {
    if (!focusFrom(order, 1)) focusFrom(order, -1, true);
    onReveal(position);
  };

  useEffect(() => {
    const first = blanks.find((token) => !(token.position in revealed));
    if (first) inputs.current.get(first.position)?.focus({ preventScroll: true });
    // chỉ chọn ô đầu khi vào câu; các lần mở ô sau do người dùng tự điều hướng
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, order: number) => {
    // Enter đang chọn chữ của bộ gõ thì không phải lệnh nộp.
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    } else if (event.key === " ") {
      event.preventDefault();
      focusFrom(order, 1);
    } else if (event.key === "Backspace" && event.currentTarget.value === "") {
      event.preventDefault();
      focusFrom(order, -1, true);
    }
  };

  return (
    <div>
      <div
        role="group"
        aria-label={t("input.cloze")}
        className="flex flex-wrap items-end gap-x-2 gap-y-2 rounded-lg border border-border-strong bg-bg-base px-4 py-4 text-xl font-medium leading-normal"
      >
        {tokens.map((token) => {
          if (!token.blank) {
            return (
              <span key={token.position} className="inline-flex h-10 items-center">
                {token.display}
              </span>
            );
          }
          const order = blanks.indexOf(token);
          const label = t("input.blank", { n: order + 1, total: blanks.length });
          const length = token.length ?? 4;
          if (token.position in revealed) {
            return (
              <span key={token.position} className="inline-flex flex-col items-center">
                <span className="h-7" aria-hidden="true" />
                <span
                  title={t("input.revealed")}
                  aria-label={`${label}: ${revealed[token.position]}. ${t("input.revealed")}`}
                  style={{ minWidth: `${Math.max(3, length + 1)}ch` }}
                  className="inline-flex h-10 items-center justify-center rounded-sm border border-dashed border-warning bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-2 text-warning"
                >
                  {revealed[token.position]}
                </span>
              </span>
            );
          }
          return (
            <span key={token.position} className="inline-flex flex-col items-center">
              <button
                type="button"
                aria-label={`${t("input.reveal")} (${order + 1})`}
                title={t("input.reveal")}
                disabled={revealing}
                onClick={() => reveal(token.position, order)}
                className="inline-flex h-7 w-9 flex-none cursor-pointer items-center justify-center rounded-sm text-text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-text disabled:cursor-wait disabled:opacity-50"
              >
                <Icon name="eye" className="h-4 w-4" />
              </button>
              <input
                ref={(node) => {
                  if (node) inputs.current.set(token.position, node);
                  else inputs.current.delete(token.position);
                }}
                value={values[token.position] ?? ""}
                aria-label={label}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                style={{ width: `${Math.max(3, length + 1.5)}ch` }}
                onChange={(e) => onChange(token.position, e.target.value.replace(/\s+/g, " ").trimStart())}
                onKeyDown={(e) => onKeyDown(e, order)}
                className="h-10 min-w-12 max-w-full rounded-sm border border-border-strong bg-bg-elevated px-2 text-center text-xl font-semibold transition-[border-color,box-shadow] duration-200 focus:border-fn-dictation focus:outline-none focus:shadow-[0_0_0_3px_var(--fn-dictation-soft)]"
              />
            </span>
          );
        })}
      </div>
      <InputActions extraHint={t("input.clozeHint")} submitting={submitting} onSubmit={onSubmit} onGiveUp={onGiveUp} />
    </div>
  );
}
