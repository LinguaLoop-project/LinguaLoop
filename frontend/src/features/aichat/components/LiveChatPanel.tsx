import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import TutorStage from "@/features/tutor/components/TutorStage";
import { useAiEnergy } from "@/hooks/useAiEnergy";
import { useLiveChat } from "../hooks/useLiveChat";
import type { ChatStyle } from "../types";
import { formatClock } from "../utils";
import ChatThread from "./ChatThread";
import SummaryCard from "./SummaryCard";

export interface LiveChatPanelProps {
  lessonId: string;
  style: ChatStyle;
  /** Phát đoạn video bên cạnh theo lời gia sư; trả về khi phát xong, false nếu không phát được. */
  playClip: (startMs: number, endMs: number) => Promise<boolean>;
  /** Video bên cạnh đang phát (kể cả người học tự bấm): micro tạm khóa để không thu tiếng video. */
  videoPlaying: boolean;
  /** Không dùng được micro hoặc Gemini Live: chuyển sang chat chữ. */
  onUseText: () => void;
  /** "Trò chuyện lần mới": mount lại khung để tạo phiên mới. */
  onAgain: () => void;
  onBack: () => void;
}

/**
 * Phiên giọng nói của Thực hành với AI theo bài (UC-AI-01), nói chuyện trực tiếp với gia sư qua Gemini Live: micro mở liên
 * tục, gia sư nói và có thể bị ngắt lời, phụ đề hiện từng lượt, mỗi câu trả lời có thẻ nhận xét. Hết câu hỏi hoặc 15 phút
 * thì gia sư chào kết và nhận xét tổng quát hiện ra.
 */
export default function LiveChatPanel({ lessonId, style, playClip, videoPlaying, onUseText, onAgain, onBack }: Readonly<LiveChatPanelProps>) {
  const { t } = useTranslation("aichat");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPro } = useAiEnergy();
  const { state, controller } = useLiveChat(lessonId, style, playClip);
  const { phase, limits } = state;

  // Vào phiên sau một nhịp để StrictMode (mount, gỡ, mount lại) không bắt đầu rồi thoát ngay
  useEffect(() => {
    const timer = setTimeout(() => void controller.start(), 0);
    return () => clearTimeout(timer);
  }, [controller]);

  useEffect(() => {
    controller.setExternalAudio(videoPlaying);
  }, [controller, videoPlaying]);

  // Phiên kết thúc: lịch sử có thêm một dòng
  const reported = useRef(false);
  useEffect(() => {
    if (phase !== "ended" || reported.current) return;
    reported.current = true;
    void queryClient.invalidateQueries({ queryKey: ["aichat", lessonId] });
  }, [phase, queryClient, lessonId]);

  const live = phase === "live";
  const left = limits ? Math.max(0, limits.maxSeconds - state.elapsedSeconds) : 0;
  const asked = state.messages.filter((m) => m.role === "tutor").length;
  const last = state.messages.at(-1);
  const waitingAnswer = live && last?.role === "tutor";
  const caption = state.playingClip
    ? t("live.playingClip")
    : state.tutorSpeaking
    ? t("live.speaking")
    : state.muted
      ? t("live.muted")
      : state.captions.learner && state.captions.learner !== ""
        ? t("live.listening")
        : t("live.yourTurn");

  return (
    <section aria-label={t("title")} className="flex flex-col gap-4">
      {live && limits && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-[13px] font-semibold text-primary-text">
            {t("bar.question", { n: Math.min(Math.max(asked, 1), limits.maxQuestions), max: limits.maxQuestions })}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold tabular-nums ${
              left <= 60 ? "border-danger text-danger" : "border-border-strong text-text-muted"
            }`}
          >
            <Icon name="timer" className="size-3.5" />
            {t("bar.timeLeft", { time: formatClock(left) })}
          </span>
        </div>
      )}

      {(phase === "idle" || phase === "connecting") && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-6 text-center">
          <TutorStage controller={controller} mood="hello" caption={t("live.connecting")} />
          <p className="max-w-md text-[13px] text-text-muted">{t("live.micNote", { cost: state.cost || undefined })}</p>
        </div>
      )}

      {phase === "fallback" && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-bold">{t("live.fallbackTitle")}</h2>
          <p className="text-sm text-text-muted">
            {t(`errors.${state.fallbackCode}`, { defaultValue: t("live.fallbackGeneric") })}
          </p>
          <div className="flex flex-wrap gap-2">
            {state.fallbackCode === "QUOTA_EXCEEDED" ? (
              !isPro && (
                <Button leftIcon={<Icon name="crown" />} onClick={() => navigate("/pricing")}>
                  {t("upgrade")}
                </Button>
              )
            ) : (
              <>
                <Button onClick={() => void controller.start()} leftIcon={<Icon name="rotate-cw" />}>
                  {t("retry")}
                </Button>
                <Button variant="ghost" onClick={onUseText} leftIcon={<Icon name="keyboard" />}>
                  {t("live.useText")}
                </Button>
              </>
            )}
            <Button variant="text" onClick={onBack}>
              {t("summary.backToLesson")}
            </Button>
          </div>
        </div>
      )}

      {(live || phase === "ending" || phase === "ended") && (
        <>
          {live && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-4 pb-4 pt-2">
              <TutorStage controller={controller} mood={state.tutorSpeaking ? "speaking" : "listening"} caption={caption} />
              <div className="flex min-h-14 w-full max-w-xl flex-col gap-1 text-center" aria-live="polite">
                {state.captions.tutor && <p className="text-[15px] leading-relaxed">{state.captions.tutor}</p>}
                {state.captions.learner && (
                  <p className="text-sm leading-relaxed text-text-muted">
                    <Icon name="mic" className="mr-1 inline size-3.5 align-[-2px]" />
                    {state.captions.learner}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant={state.muted ? "primary" : "ghost"}
                  size="sm"
                  aria-pressed={state.muted}
                  onClick={() => controller.setMuted(!state.muted)}
                  leftIcon={<Icon name={state.muted ? "mic-off" : "mic"} />}
                >
                  {state.muted ? t("live.unmute") : t("live.mute")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!waitingAnswer || !!last?.hint}
                  isLoading={state.hintLoading}
                  onClick={() => void controller.askHint()}
                  leftIcon={<Icon name="lightbulb" />}
                >
                  {t("answer.hint")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!waitingAnswer || state.replayUsed || state.playingClip}
                  title={t("live.replayHint")}
                  onClick={() => void controller.replayClip()}
                  leftIcon={<Icon name="rotate-ccw" />}
                >
                  {t("live.replay")}
                </Button>
                <Button variant="text" size="sm" onClick={() => controller.leave()} leftIcon={<Icon name="check-check" />}>
                  {state.answered >= 1 ? t("bar.finish") : t("live.leave")}
                </Button>
              </div>
            </div>
          )}

          {state.messages.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
              <ChatThread messages={state.messages} thinking={false} />
            </div>
          )}

          {phase === "ending" && (
            <p role="status" className="flex items-center gap-2 text-sm text-text-muted">
              <Icon name="loader-circle" className="size-4 animate-spin" />
              {state.answered >= 1 ? t("live.summarizing") : t("live.closing")}
            </p>
          )}

          {phase === "ended" && (
            <>
              {state.finalSession && state.finalSession.answered >= 1 ? (
                <SummaryCard
                  session={state.finalSession}
                  expired={false}
                  readOnly={false}
                  retrying={false}
                  onRetry={() => void controller.retrySummary()}
                  onAgain={onAgain}
                  onBack={onBack}
                />
              ) : state.summaryFailed ? (
                <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5">
                  <p className="text-sm text-text-muted">{t("summary.failed")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void controller.retrySummary()} leftIcon={<Icon name="rotate-cw" />}>
                      {t("summary.retry")}
                    </Button>
                    <Button variant="ghost" onClick={onBack}>
                      {t("summary.backToLesson")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-5">
                  <p className="flex-1 text-sm text-text-muted">{t("summary.stopped")}</p>
                  <Button onClick={onAgain} leftIcon={<Icon name="messages-square" />}>
                    {t("summary.again")}
                  </Button>
                  <Button variant="ghost" onClick={onBack}>
                    {t("summary.backToLesson")}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
