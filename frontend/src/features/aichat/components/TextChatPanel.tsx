import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { toApiError } from "@/features/auth";
import { useAiEnergy } from "@/hooks/useAiEnergy";
import { useChatActions } from "../hooks/useAiChat";
import type { ChatCredit, ChatSession, ChatTurn } from "../types";
import { canFinish, formatClock, pendingQuestion, questionNumber, secondsLeft } from "../utils";
import AnswerBar from "./AnswerBar";
import ChatThread from "./ChatThread";
import SummaryCard from "./SummaryCard";

export interface TextChatPanelProps {
  lessonId: string;
  /** "Trò chuyện lần mới": mount lại khung để tạo cuộc mới. */
  onAgain: () => void;
  onBack: () => void;
}

/**
 * Chế độ chat chữ của Thực hành với AI theo bài, dùng khi không có micro hoặc không nối được Gemini Live. Mỗi lượt là một
 * lần gọi Gemini và trừ credit theo chi phí thật (BR-AI-04); tối đa 5 câu hỏi và 15 phút như chế độ giọng nói.
 */
export default function TextChatPanel({ lessonId, onAgain, onBack }: Readonly<TextChatPanelProps>) {
  const { t } = useTranslation("aichat");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPro } = useAiEnergy();
  const { start, answer, finish, hint } = useChatActions(lessonId);

  const [session, setSession] = useState<ChatSession | null>(null);
  const [credit, setCredit] = useState<ChatCredit | null>(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<{ code: string; retry?: () => void } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const timedOut = useRef(false);
  const began = useRef(false);

  const apply = useCallback((turn: ChatTurn) => {
    setSession(turn.session);
    setCredit(turn.credit);
    setExpired(turn.expired);
    setError(null);
  }, []);

  const showError = (cause: unknown, retry?: () => void) => {
    const code = toApiError(cause).code;
    if (code === "AI_CHAT_TURN_CONFLICT" || code === "AI_CHAT_NOT_ACTIVE") {
      void queryClient.invalidateQueries({ queryKey: ["aichat", lessonId] });
    }
    setError({ code, retry });
  };

  function begin() {
    setError(null);
    start.mutate(undefined, { onSuccess: apply, onError: (cause) => showError(cause, begin) });
  }

  // Vào cuộc chat ngay khi hiện; ref chặn StrictMode (mount, gỡ, mount lại) và lần render lại tạo hai cuộc
  useEffect(() => {
    if (began.current) return;
    began.current = true;
    begin();
  });

  const running = session?.status === "active";
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  // Hết 15 phút: có câu trả lời thì tạo nhận xét tổng quát
  const left = session ? secondsLeft(session.expiresAt, now) : 0;
  const mutateFinish = finish.mutate;
  useEffect(() => {
    if (!session || session.status !== "active" || left > 0 || timedOut.current) return;
    timedOut.current = true;
    if (session.answered >= 1) mutateFinish(session.id, { onSuccess: apply });
  }, [left, session, mutateFinish, apply]);

  const submit = (text: string) => {
    if (!session) return;
    setError(null);
    answer.mutate({ sessionId: session.id, text }, { onSuccess: apply, onError: (cause) => showError(cause, () => submit(text)) });
  };

  const askHint = () => {
    if (!session) return;
    hint.mutate(session.id, {
      onSuccess: ({ hint: text }) =>
        setSession((current) =>
          current
            ? {
                ...current,
                messages: current.messages.map((m, index) =>
                  index === current.messages.length - 1 && m.role === "tutor" ? { ...m, hint: text } : m,
                ),
              }
            : current,
        ),
      onError: (cause) => showError(cause),
    });
  };

  const finishNow = () => {
    if (!session) return;
    setError(null);
    finish.mutate(session.id, { onSuccess: apply, onError: (cause) => showError(cause, finishNow) });
  };

  const errorText = (code: string) => t(`errors.${code}`, { defaultValue: t("errors.generic") });
  const question = pendingQuestion(session);
  const busy = answer.isPending || finish.isPending || start.isPending;
  const active = session?.status === "active";
  const showSummary = session !== null && (session.status === "completed" || session.awaitingSummary);

  return (
    <section aria-label={t("title")} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1 text-[13px] font-semibold text-text-muted">
          <Icon name="keyboard" className="size-3.5" />
          {t("text.badge")}
        </span>
        {session && active && (
          <>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-[13px] font-semibold text-primary-text">
              {t("bar.question", { n: questionNumber(session), max: session.maxQuestions })}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold tabular-nums ${
                left <= 60 ? "border-danger text-danger" : "border-border-strong text-text-muted"
              }`}
            >
              <Icon name="timer" className="size-3.5" />
              {t("bar.timeLeft", { time: formatClock(left) })}
            </span>
          </>
        )}
      </div>

      {start.isPending && !session && (
        <p role="status" className="flex items-center gap-2 text-sm text-text-muted">
          <Icon name="loader-circle" className="size-4 animate-spin" />
          {t("intro.starting")}
        </p>
      )}

      {session && (
        <>
          <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
            <ChatThread messages={session.messages} thinking={answer.isPending} />
          </div>
          {showSummary && (
            <SummaryCard
              session={session}
              expired={expired}
              readOnly={false}
              retrying={finish.isPending}
              onRetry={finishNow}
              onAgain={onAgain}
              onBack={onBack}
            />
          )}
        </>
      )}

      {error && (
        <div role="alert" className="flex flex-wrap items-start gap-3 rounded-lg border border-danger/50 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm">
          <Icon name="circle-alert" className="mt-0.5 size-4 shrink-0 text-danger" />
          <span className="min-w-48 flex-1">{errorText(error.code)}</span>
          {error.code === "QUOTA_EXCEEDED" && !isPro && (
            <Button size="sm" leftIcon={<Icon name="crown" />} onClick={() => navigate("/pricing")}>
              {t("upgrade")}
            </Button>
          )}
          {error.retry && !["QUOTA_EXCEEDED", "LESSON_PRO_REQUIRED"].includes(error.code) && (
            <Button variant="ghost" size="sm" onClick={error.retry} leftIcon={<Icon name="rotate-cw" />}>
              {t("answer.retry")}
            </Button>
          )}
        </div>
      )}

      {session && active && !session.awaitingSummary && (
        <div className="sticky bottom-3 z-10 flex flex-col gap-2">
          {credit && credit.charged > 0 && (
            <p className="px-1 text-xs text-text-subtle" aria-live="polite">
              {t("thread.creditUsed", { charged: credit.charged, balance: credit.balance.balance })}
            </p>
          )}
          <AnswerBar busy={busy || !question} hintShown={!!question?.hint} hintLoading={hint.isPending} onSubmit={submit} onHint={askHint} />
          <div className="flex items-center justify-end px-1">
            <Button
              variant="text"
              size="sm"
              disabled={busy || !canFinish(session)}
              title={canFinish(session) ? undefined : t("bar.finishNeedAnswer")}
              onClick={finishNow}
              leftIcon={<Icon name="check-check" />}
            >
              {t("bar.finish")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
