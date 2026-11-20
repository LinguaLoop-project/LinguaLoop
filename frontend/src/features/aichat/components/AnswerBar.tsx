import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { useWavRecorder } from "@/features/shadowing/hooks/useWavRecorder";
import type { ChatAnswer } from "../types";
import { formatClock, MAX_ANSWER_LENGTH, MAX_RECORDING_SECONDS, validAnswerText } from "../utils";

export interface AnswerBarProps {
  /** Đang chờ gia sư: khóa mọi nút để không gửi hai lần. */
  busy: boolean;
  /** Gợi ý của câu hiện tại đã có trên màn hình. */
  hintShown: boolean;
  hintLoading: boolean;
  onSubmit: (answer: ChatAnswer) => void;
  onHint: () => void;
}

/**
 * Ô trả lời ở đáy: gõ chữ (1 đến 1000 ký tự) hoặc ghi âm (bấm bắt đầu, bấm lần nữa để dừng và gửi, tối đa 30 giây).
 * Gợi ý miễn phí nên luôn bấm được khi chưa gửi.
 */
export default function AnswerBar({ busy, hintShown, hintLoading, onSubmit, onHint }: Readonly<AnswerBarProps>) {
  const { t } = useTranslation("aichat");
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const recorder = useWavRecorder();
  const { recording, start, stop, cancel } = recorder;
  const stopRef = useRef<() => void>(() => undefined);

  const finishRecording = () => {
    const wav = stop();
    if (!wav) {
      setNotice(t("answer.tooShort"));
      return;
    }
    onSubmit({ audio: wav });
  };
  useEffect(() => {
    stopRef.current = finishRecording;
  });

  // Đồng hồ ghi âm; đủ 30 giây thì tự dừng và gửi
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current + 1 >= MAX_RECORDING_SECONDS) stopRef.current();
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const toggleRecording = async () => {
    setNotice(null);
    if (recording) {
      finishRecording();
      return;
    }
    try {
      setSeconds(0);
      await start();
    } catch {
      setNotice(t("answer.micDenied"));
    }
  };

  const send = () => {
    if (!validAnswerText(text)) return;
    onSubmit({ text: text.trim() });
    setText("");
  };

  return (
    <div className="rounded-xl border border-border-strong bg-surface p-3 shadow-[var(--shadow-card)]">
      {recording ? (
        <div className="flex items-center gap-3 px-1 py-2" role="status">
          <span aria-hidden="true" className="size-2.5 animate-pulse rounded-full bg-danger" />
          <span className="flex-1 text-sm font-semibold tabular-nums">
            {t("answer.recording", { time: formatClock(seconds) })}
          </span>
          <Button variant="ghost" size="sm" onClick={cancel} leftIcon={<Icon name="x" />}>
            {t("answer.cancelRecording")}
          </Button>
          <Button size="sm" onClick={() => void toggleRecording()} leftIcon={<Icon name="send" />}>
            {t("answer.stopAndSend")}
          </Button>
        </div>
      ) : (
        <>
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
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              aria-label={t("answer.record")}
              onClick={() => void toggleRecording()}
              leftIcon={<Icon name="mic" />}
            >
              {t("answer.record")}
            </Button>
            <Button size="sm" disabled={busy || !validAnswerText(text)} onClick={send} leftIcon={<Icon name="send" />}>
              {t("answer.send")}
            </Button>
          </div>
        </>
      )}
      {notice && (
        <p role="alert" className="mt-2 flex items-start gap-2 text-[13px] text-danger">
          <Icon name="circle-alert" className="mt-0.5 size-4 shrink-0" />
          {notice}
        </p>
      )}
    </div>
  );
}
