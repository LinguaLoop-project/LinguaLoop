import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { toApiError } from "@/features/auth";
import Breadcrumbs from "@/features/lesson/components/Breadcrumbs";
import { useLessonDetail } from "@/features/lesson/hooks/useLessons";
import { useSegmentPlayer } from "@/features/lesson/manage/useSegmentPlayer";
import { useCreditBalance } from "@/features/subscription/hooks/useCredit";
import ChatThread from "../components/ChatThread";
import HistoryDialog from "../components/HistoryDialog";
import LiveChatPanel from "../components/LiveChatPanel";
import SummaryCard from "../components/SummaryCard";
import TextChatPanel from "../components/TextChatPanel";
import { useChatDetail } from "../hooks/useAiChat";
import type { ChatStyle } from "../types";

type Mode = "intro" | "live" | "text";

const STYLES: ChatStyle[] = ["qa", "interview", "retell"];

/**
 * Thực hành với AI theo bài (UC-AI-01). Giới thiệu rồi nói chuyện trực tiếp với gia sư (Gemini Live); chat chữ là dự phòng
 * khi không có micro hoặc không nối được. Lịch sử mở ở hộp thoại; xem lại một cuộc cũ là chỉ đọc và không tốn credit.
 */
export default function AiChatPage() {
  const { id: lessonId = "" } = useParams<{ id: string }>();
  const { t } = useTranslation("aichat");
  const navigate = useNavigate();
  const lesson = useLessonDetail(lessonId);
  const credit = useCreditBalance();

  const [mode, setMode] = useState<Mode>("intro");
  /** Đổi sau mỗi lần "Trò chuyện lần mới" để mount lại khung và tạo phiên mới. */
  const [run, setRun] = useState(0);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const review = useChatDetail(lessonId, reviewId);
  const [style, setStyle] = useState<ChatStyle>("qa");

  // Khung video bên cạnh do trình phát YouTube điều khiển được, để gia sư mời nghe lại một đoạn (play_clip)
  const videoBox = useRef<HTMLDivElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const clipPlayer = useSegmentPlayer(lesson.data?.youtubeId ?? null, videoBox, setVideoPlaying);
  const playClip = async (startMs: number, endMs: number): Promise<boolean> => {
    if (clipPlayer.status !== "ready") return false;
    clipPlayer.play("clip", startMs, endMs);
    await new Promise((resolve) => window.setTimeout(resolve, endMs - startMs + 600));
    clipPlayer.stop();
    return true;
  };

  const errorText = (code: string) => t(`errors.${code}`, { defaultValue: t("errors.generic") });
  const lessonPath = `/student/lessons/${lessonId}`;
  const balance = credit.data?.balance;

  const crumbs = (
    <Breadcrumbs
      items={[
        { label: t("breadcrumbLessons"), to: "/student/lessons" },
        { label: lesson.data?.title ?? "…", to: lessonPath },
        { label: t("title") },
      ]}
    />
  );

  if (lesson.isPending) {
    return (
      <section className="w-full" aria-busy="true">
        <Skeleton className="mb-4 h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  if (lesson.isError || !lesson.data) {
    const code = lesson.isError ? toApiError(lesson.error).code : "generic";
    return (
      <section className="w-full">
        {crumbs}
        <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-text-muted">{code === "LESSON_NOT_FOUND" ? errorText(code) : t("loadFailed")}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => void lesson.refetch()}>
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
  const again = () => setRun((n) => n + 1);
  const openReview = (id: string) => {
    setHistoryOpen(false);
    setReviewId(id);
  };

  return (
    <section className="w-full">
      {crumbs}
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex min-w-0 flex-col gap-4">
          <header className="flex flex-wrap items-center gap-2">
            <h1 className="mr-auto flex items-center gap-2 font-display text-2xl font-bold">
              <Icon name="bot" className="size-6 text-primary-text" />
              {t("title")}
            </h1>
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

          {/* (1) Video lớn ở đầu cột; trình phát YouTube do trang điều khiển để gia sư và nút "Nghe lại" phát lại đoạn */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div
              ref={videoBox}
              aria-label={t("video.title")}
              className="aspect-video w-full bg-black [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full"
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <Link to={lessonPath} className="text-sm font-semibold text-primary-text underline underline-offset-4">
                {lesson.data.title}
              </Link>
              <span className="text-[13px] text-text-muted">{t("video.hint")}</span>
            </div>
          </div>

          {reviewId && (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3 text-[13px] text-text-muted">
                <Icon name="eye" className="size-4" />
                <span className="flex-1">{t("history.reviewing")}</span>
                <Button variant="text" size="sm" onClick={() => setReviewId(null)}>
                  {t("history.backToCurrent")}
                </Button>
              </div>
              {review.isPending ? (
                <Skeleton className="h-64 w-full" />
              ) : review.isError ? (
                <div className="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
                  {errorText(toApiError(review.error).code)}
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
                    <ChatThread messages={review.data.messages} thinking={false} readOnly />
                  </div>
                  <SummaryCard
                    session={review.data}
                    expired={false}
                    readOnly
                    retrying={false}
                    onRetry={() => undefined}
                    onAgain={() => undefined}
                    onBack={() => navigate(lessonPath)}
                  />
                </>
              )}
            </>
          )}

          {!reviewId && locked && (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-6">
              <p className="text-sm">{errorText("LESSON_PRO_REQUIRED")}</p>
              <Button leftIcon={<Icon name="crown" />} onClick={() => navigate("/pricing")}>
                {t("upgrade")}
              </Button>
            </div>
          )}

          {!reviewId && !locked && mode === "intro" && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="font-display text-xl font-bold">{t("intro.heading")}</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-muted">{t("intro.desc")}</p>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {(["ruleQuestions", "ruleTime", "ruleCredit", "ruleMic", "ruleWatch"] as const).map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success" />
                    {t(`intro.${rule}`)}
                  </li>
                ))}
              </ul>
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">{t("styles.legend")}</legend>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {STYLES.map((option) => (
                    <label
                      key={option}
                      className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                        style === option ? "border-primary bg-primary-soft" : "border-border bg-bg-elevated hover:border-border-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ai-chat-style"
                        value={option}
                        checked={style === option}
                        onChange={() => setStyle(option)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">{t(`styles.${option}.title`)}</span>
                      <span className="text-[13px] leading-snug text-text-muted">{t(`styles.${option}.desc`)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => setMode("live")} leftIcon={<Icon name="mic" />}>
                  {t("intro.start")}
                </Button>
                <Button variant="text" onClick={() => setMode("text")} leftIcon={<Icon name="keyboard" />}>
                  {t("intro.useText")}
                </Button>
              </div>
            </div>
          )}

          {/* Xem lại lịch sử không được làm rớt cuộc gọi đang diễn ra: ẩn khung chứ không gỡ */}
          {!locked && mode === "live" && (
            <div hidden={!!reviewId}>
              <LiveChatPanel
                key={run}
                lessonId={lessonId}
                style={style}
                playClip={playClip}
                videoPlaying={videoPlaying}
                onUseText={() => {
                  setMode("text");
                  again();
                }}
                onAgain={again}
                onBack={() => navigate(lessonPath)}
              />
            </div>
          )}

          {!locked && mode === "text" && (
            <div hidden={!!reviewId}>
              <TextChatPanel key={run} lessonId={lessonId} onAgain={again} onBack={() => navigate(lessonPath)} />
            </div>
          )}
        </div>
      </div>

      <HistoryDialog lessonId={lessonId} open={historyOpen} onClose={() => setHistoryOpen(false)} onOpenSession={openReview} />
    </section>
  );
}
