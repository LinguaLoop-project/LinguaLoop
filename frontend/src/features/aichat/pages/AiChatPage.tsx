import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { toApiError } from "@/features/auth";
import Breadcrumbs from "@/features/lesson/components/Breadcrumbs";
import { useLessonDetail } from "@/features/lesson/hooks/useLessons";
import { useAiEnergy } from "@/hooks/useAiEnergy";
import AnswerBar from "../components/AnswerBar";
import ChatThread from "../components/ChatThread";
import HistoryDialog from "../components/HistoryDialog";
import SummaryCard from "../components/SummaryCard";
import { useActiveChat, useChatActions, useChatDetail } from "../hooks/useAiChat";
import type { ChatAnswer, ChatCredit, ChatSession, ChatTurn } from "../types";
import { canFinish, formatClock, pendingQuestion, questionNumber, secondsLeft } from "../utils";

/**
 * Thực hành với AI theo bài (UC-AI-01). Một màn hình ba trạng thái: giới thiệu (chưa có phiên), hỏi tiếp tục hay bắt đầu lại
 * (còn phiên dang dở), và cuộc trò chuyện. Lịch sử mở ở hộp thoại; xem lại một phiên cũ là chỉ đọc và không tốn credit.
 */
export default function AiChatPage() {
  const { id: lessonId = "" } = useParams<{ id: string }>();
  const { t } = useTranslation("aichat");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPro } = useAiEnergy();
  const lesson = useLessonDetail(lessonId);
  const active = useActiveChat(lessonId);
  const { start, answer, finish, hint } = useChatActions(lessonId);

  const [current, setSession] = useState<ChatSession | null>(null);
  const [expired, setExpired] = useState(false);
  const [credit, setCredit] = useState<ChatCredit | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [error, setError] = useState<{ code: string; retry?: () => void } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const review = useChatDetail(lessonId, reviewId);
  const timedOut = useRef(false);

  const apply = useCallback((turn: ChatTurn) => {
    setSession(turn.session);
    setCredit(turn.credit);
    setExpired(turn.expired);
    setError(null);
  }, []);

  // Đồng hồ 15 phút chạy theo mốc hết giờ của server
  const running = current?.status === "active";
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const left = current ? secondsLeft(current.expiresAt, now) : 0;
  // Hết 15 phút mà chưa trả lời câu nào: server đã đóng phiên, quay về màn giới thiệu
  const session = current && !(current.status === "active" && left === 0 && current.answered < 1) ? current : null;
  const mutateFinish = finish.mutate;
  useEffect(() => {
    if (!session || session.status !== "active" || left > 0 || timedOut.current) return;
    timedOut.current = true;
    if (session.answered >= 1) mutateFinish(session.id, { onSuccess: apply });
  }, [left, session, mutateFinish, apply]);

  useEffect(() => {
    if (current && !session) void queryClient.invalidateQueries({ queryKey: ["aichat", lessonId] });
  }, [current, session, queryClient, lessonId]);

  const showError = (cause: unknown, retry?: () => void) => {
    const code = toApiError(cause).code;
    if (code === "AI_CHAT_TURN_CONFLICT" || code === "AI_CHAT_NOT_ACTIVE") {
      // Phiên đã đổi ở nơi khác: tải lại trạng thái thật rồi báo
      void queryClient.invalidateQueries({ queryKey: ["aichat", lessonId] });
      setSession(null);
    }
    setError({ code, retry });
  };

  const begin = () => {
    setError(null);
    setConfirmRestart(false);
    setReviewId(null);
    timedOut.current = false;
    start.mutate(undefined, { onSuccess: apply, onError: (cause) => showError(cause, begin) });
  };

  const submit = (value: ChatAnswer) => {
    if (!session) return;
    setError(null);
    answer.mutate(
      { sessionId: session.id, answer: value },
      { onSuccess: apply, onError: (cause) => showError(cause, () => submit(value)) },
    );
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

  const openReview = (id: string) => {
    setHistoryOpen(false);
    setReviewId(id);
  };

  const errorText = (code: string) => t(`errors.${code}`, { defaultValue: t("errors.generic") });
  const lessonPath = `/student/lessons/${lessonId}`;
  const balance = credit?.balance.balance;
  const question = pendingQuestion(session);
  const busy = answer.isPending || finish.isPending || start.isPending;

  const crumbs = (
    <Breadcrumbs
      items={[
        { label: t("breadcrumbLessons"), to: "/student/lessons" },
        { label: lesson.data?.title ?? "…", to: lessonPath },
        { label: t("title") },
      ]}
    />
  );

  if (lesson.isPending || active.isPending) {
    return (
      <section className="w-full" aria-busy="true">
        <Skeleton className="mb-4 h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  if (lesson.isError || active.isError || !lesson.data) {
    const code = lesson.isError ? toApiError(lesson.error).code : "generic";
    return (
      <section className="w-full">
        {crumbs}
        <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-text-muted">{code === "LESSON_NOT_FOUND" ? errorText(code) : t("loadFailed")}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => void Promise.all([lesson.refetch(), active.refetch()])}>
              {t("retry")}
            </Button>
            <Button variant="text" onClick={() => navigate("/student/lessons")}>
              {t("breadcrumbLessons")}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const locked = lesson.data.locked;
  const shown: ChatSession | null = reviewId ? (review.data ?? null) : session;
  const resumable = !reviewId && !session ? active.data : null;
  const ended = shown !== null && shown.status !== "active";
  const showSummary = shown !== null && (shown.status === "completed" || shown.awaitingSummary);

  return (
    <section className="w-full">
      {crumbs}
      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-wrap items-center gap-2">
            <h1 className="mr-auto flex items-center gap-2 font-display text-2xl font-bold">
              <Icon name="bot" className="size-6 text-primary-text" />
              {t("title")}
            </h1>
            {session && !reviewId && session.status === "active" && (
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
            {balance !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1 text-[13px] font-semibold text-text-muted">
                <Icon name="zap" className="size-3.5" />
                {t("bar.credit", { balance })}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)} leftIcon={<Icon name="history" />}>
              {t("bar.history")}
            </Button>
          </header>

          {reviewId && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3 text-[13px] text-text-muted">
              <Icon name="eye" className="size-4" />
              <span className="flex-1">{t("history.reviewing")}</span>
              <Button variant="text" size="sm" onClick={() => setReviewId(null)}>
                {t("history.backToCurrent")}
              </Button>
            </div>
          )}

          {reviewId && review.isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : reviewId && review.isError ? (
            <div className="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
              {errorText(toApiError(review.error).code)}
            </div>
          ) : locked ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-6">
              <p className="text-sm">{errorText("LESSON_PRO_REQUIRED")}</p>
              <Button leftIcon={<Icon name="crown" />} onClick={() => navigate("/pricing")}>
                {t("upgrade")}
              </Button>
            </div>
          ) : resumable ? (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-display text-xl font-bold">{t("resume.heading")}</h2>
              <p className="mt-1 text-sm text-text-muted">
                {t("resume.desc", { count: resumable.answered, time: formatClock(secondsLeft(resumable.expiresAt, now)) })}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => {
                    timedOut.current = false;
                    setNow(Date.now());
                    setSession(resumable);
                  }}
                  leftIcon={<Icon name="play" />}
                >
                  {t("resume.continue")}
                </Button>
                <Button variant="ghost" isLoading={start.isPending} onClick={begin} leftIcon={<Icon name="rotate-ccw" />}>
                  {t("resume.restart")}
                </Button>
                <span className="text-[13px] text-text-subtle">{t("resume.restartNote")}</span>
              </div>
            </div>
          ) : !shown ? (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-display text-xl font-bold">{t("intro.heading")}</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-muted">{t("intro.desc")}</p>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {(["ruleQuestions", "ruleTime", "ruleCredit", "ruleWatch"] as const).map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success" />
                    {t(`intro.${rule}`)}
                  </li>
                ))}
              </ul>
              <Button className="mt-5" size="lg" isLoading={start.isPending} onClick={begin} leftIcon={<Icon name="messages-square" />}>
                {start.isPending ? t("intro.starting") : t("intro.start")}
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
                <ChatThread messages={shown.messages} thinking={answer.isPending} readOnly={!!reviewId} />
              </div>

              {showSummary && (
                <SummaryCard
                  session={shown}
                  expired={expired && !reviewId}
                  readOnly={!!reviewId}
                  retrying={finish.isPending}
                  onRetry={finishNow}
                  onAgain={begin}
                  onBack={() => navigate(lessonPath)}
                />
              )}
              {ended && !showSummary && !reviewId && (
                <Button variant="ghost" onClick={begin} isLoading={start.isPending} leftIcon={<Icon name="messages-square" />}>
                  {t("summary.again")}
                </Button>
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

          {session && !reviewId && session.status === "active" && !session.awaitingSummary && (
            <div className="sticky bottom-3 z-10 flex flex-col gap-2">
              {credit && credit.charged > 0 && (
                <p className="px-1 text-xs text-text-subtle" aria-live="polite">
                  {t("thread.creditUsed", { charged: credit.charged, balance: credit.balance.balance })}
                </p>
              )}
              <AnswerBar
                busy={busy || !question}
                hintShown={!!question?.hint}
                hintLoading={hint.isPending}
                onSubmit={submit}
                onHint={askHint}
              />
              <div className="flex items-center justify-between gap-2 px-1">
                <Button variant="text" size="sm" disabled={busy} onClick={() => setConfirmRestart(true)} leftIcon={<Icon name="rotate-ccw" />}>
                  {t("bar.restart")}
                </Button>
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
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="aspect-video bg-black">
              <iframe
                title={t("video.title")}
                src={`https://www.youtube-nocookie.com/embed/${lesson.data.youtubeId}?rel=0&cc_load_policy=0&playsinline=1`}
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold">{t("video.title")}</p>
              <p className="mt-1 text-[13px] text-text-muted">{t("video.hint")}</p>
              <Link to={lessonPath} className="mt-2 inline-block text-[13px] font-semibold text-primary-text underline underline-offset-4">
                {lesson.data.title}
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <HistoryDialog lessonId={lessonId} open={historyOpen} onClose={() => setHistoryOpen(false)} onOpenSession={openReview} />

      <Dialog open={confirmRestart} onClose={() => setConfirmRestart(false)} labelledBy="ai-restart-title">
        <h2 id="ai-restart-title" className="font-display text-lg font-bold">
          {t("resume.restart")}
        </h2>
        <p className="mt-2 text-sm text-text-muted">{t("resume.restartNote")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmRestart(false)}>
            {t("history.close")}
          </Button>
          <Button isLoading={start.isPending} onClick={begin} leftIcon={<Icon name="rotate-ccw" />}>
            {t("resume.restart")}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
