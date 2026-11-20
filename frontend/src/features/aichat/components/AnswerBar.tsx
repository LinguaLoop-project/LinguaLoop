import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { MAX_ANSWER_LENGTH, validAnswerText } from "../utils";

export interface AnswerBarProps {
  /** Đang chờ gia sư: khóa mọi nút để không gửi hai lần. */
  busy: boolean;
  /** Gợi ý của câu hiện tại đã có trên màn hình. */
  hintShown: boolean;
  hintLoading: boolean;
  onSubmit: (text: string) => void;
  onHint: () => void;
}

/**
 * Ô trả lời ở đáy của chế độ chat chữ (dự phòng khi không dùng được micro hoặc Gemini Live): gõ 1 đến 1000 ký tự.
 * Gợi ý miễn phí nên luôn bấm được khi chưa gửi.
 */
export default function AnswerBar({ busy, hintShown, hintLoading, onSubmit, onHint }: Readonly<AnswerBarProps>) {
  const { t } = useTranslation("aichat");
  const [text, setText] = useState("");

  const send = () => {
    if (!validAnswerText(text)) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="rounded-xl border border-border-strong bg-surface p-3 shadow-[var(--shadow-card)]">
      <label htmlFor="ai-answer" className="sr-only">
        {t("answer.label")}
      </label>
      <textarea
        id="ai-answer"
        value={text}
        disabled={busy}
        rows={2}
        maxLength={MAX_ANSWER_LENGTH}
        placeholder={t("answer.placeholder")}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            send();
          }
        }}
        className="w-full resize-none rounded-md bg-transparent px-2 py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-text-subtle disabled:opacity-60"
      />
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Button
          variant="text"
          size="sm"
          disabled={busy || hintLoading || hintShown}
          isLoading={hintLoading}
          onClick={onHint}
          leftIcon={<Icon name="lightbulb" />}
        >
          {t("answer.hint")}
        </Button>
        <span className="ml-auto text-xs tabular-nums text-text-subtle" aria-hidden="true">
          {t("answer.counter", { count: [...text].length, max: MAX_ANSWER_LENGTH })}
        </span>
        <Button size="sm" disabled={busy || !validAnswerText(text)} onClick={send} leftIcon={<Icon name="send" />}>
          {t("answer.send")}
        </Button>
      </div>
    </div>
  );
}
