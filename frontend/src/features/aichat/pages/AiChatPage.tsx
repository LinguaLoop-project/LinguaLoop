import { type ComponentProps, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import Skeleton from "@/components/common/Skeleton";
import { toApiError } from "@/features/auth";
import Breadcrumbs from "@/features/lesson/components/Breadcrumbs";
import { useLessonDetail } from "@/features/lesson/hooks/useLessons";
import { useSegmentPlayer } from "@/features/lesson/manage/useSegmentPlayer";
import CreditCost from "@/features/subscription/components/CreditCost";
import { useCreditBalance } from "@/features/subscription/hooks/useCredit";
import { formatDuration } from "@/lib/format";
import { AI_ACTION_LESSON_CHAT } from "@/features/subscription/types";
import ChatThread from "../components/ChatThread";
import HistoryDialog from "../components/HistoryDialog";
import LiveChatPanel from "../components/LiveChatPanel";
import SummaryCard from "../components/SummaryCard";
import TextChatPanel from "../components/TextChatPanel";
import { useChatDetail } from "../hooks/useAiChat";
import type { ChatStyle } from "../types";

type Mode = "intro" | "live" | "text";
type IconName = ComponentProps<typeof Icon>["name"];

const STYLES: ChatStyle[] = ["qa", "interview", "retell"];

const STYLE_ICONS: Record<ChatStyle, IconName> = {
  qa: "messages-square",
  interview: "mic",
  retell: "book-open",
};

const RULE_ITEMS: { key: "ruleQuestions" | "ruleTime" | "ruleCredit" | "ruleMic" | "ruleWatch"; icon: IconName }[] = [
  { key: "ruleQuestions", icon: "messages-square" },
  { key: "ruleTime", icon: "timer" },
  { key: "ruleCredit", icon: "zap" },
  { key: "ruleMic", icon: "mic" },
  { key: "ruleWatch", icon: "play" },
];

/**
 * Thực hành với AI theo bài (UC-AI-01). Bố cục Studio 2 cột trên Desktop:
 * - Cột trái (Sticky): Video trình phát đoạn (play_clip), thông tin bài học và quy tắc tóm tắt.
 * - Cột phải: Chọn phong cách & bắt đầu ngay trên màn hình đầu (Above-the-fold), hoặc khung đàm thoại trực tiếp.
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-80 w-full rounded-xl lg:col-span-5" />
          <Skeleton className="h-96 w-full rounded-xl lg:col-span-7" />
        </div>
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

      <div className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-5 py-3.5 shadow-[var(--shadow-card)]">
          <div className="mr-auto flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-text">
              <Icon name="bot" className="size-5" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold leading-tight md:text-2xl">{t("title")}</h1>
              <p className="text-xs text-text-muted">
                {t("card.meta", "Tối đa 5 câu hỏi · 15 phút")}
              </p>
            </div>
          </div>

          {balance !== undefined && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/60 px-3 py-1 text-[13px] font-semibold text-primary-text">
              <Icon name="zap" className="size-3.5" />
              {t("bar.credit", { balance })}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)} leftIcon={<Icon name="history" />}>
            {t("bar.history")}
          </Button>
          <Link to={lessonPath}>
            <Button variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" />}>
              {t("summary.backToLesson")}
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* CỘT TRÁI (5/12): Video bài học cố định khi cuộn + Thông tin bài + Quy tắc phiên */}
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
              <div
                ref={videoBox}
                aria-label={t("video.title")}
                className="aspect-video w-full bg-black [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full"
              />
              <div className="flex flex-col gap-2.5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {lesson.data.cefrLevel && <Badge variant={lesson.data.cefrLevel}>{lesson.data.cefrLevel}</Badge>}
                  {(lesson.data.durationSec ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                      <Icon name="clock" className="size-3.5" />
                      {formatDuration(lesson.data.durationSec ?? 0)}
                    </span>
                  )}
                  {lesson.data.sentenceCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                      <Icon name="list" className="size-3.5" />
                      {t("studio.sentenceCount", { count: lesson.data.sentenceCount })}
                    </span>
                  )}
                </div>

                <Link
                  to={lessonPath}
                  className="font-display text-base font-bold leading-snug text-text transition-colors hover:text-primary-text"
                >
                  {lesson.data.title}
                </Link>

                <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-text-muted">
                  <Icon name="eye-off" className="size-3.5 shrink-0 text-primary-text" />
                  <span>{t("video.hint")}</span>
                </div>
              </div>
            </div>

            {/* Thẻ quy tắc gọn gàng nằm ngay dưới video ở cột trái */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-text">
                <Icon name="sparkles" className="size-3.5" />
                <span>{t("studio.rulesTitle")}</span>
              </div>
              <ul className="flex flex-col gap-2.5 text-[13px] leading-snug text-text-muted">
                {RULE_ITEMS.map(({ key, icon }) => (
                  <li key={key} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                      <Icon name={icon} className="size-3" />
                    </span>
                    <span>{t(`intro.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CỘT PHẢI (7/12): Chọn chế độ & Khung hội thoại với Gia sư AI */}
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
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
              <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-4">
                  <div className="hidden shrink-0 sm:block">
                    <Mascot mood="hello" size={48} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-bold">{t("intro.heading")}</h2>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-text-muted">{t("intro.desc")}</p>
                  </div>
                </div>

                {/* 3 chip tóm tắt thông số phiên */}
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                    <Icon name="messages-square" className="size-4 shrink-0 text-primary-text" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-text">{t("studio.chips.questions")}</div>
                      <div className="truncate text-[11px] text-text-muted">{t("studio.chips.questionsHint")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                    <Icon name="timer" className="size-4 shrink-0 text-primary-text" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-text">{t("studio.chips.time")}</div>
                      <div className="truncate text-[11px] text-text-muted">{t("studio.chips.timeHint")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                    <Icon name="lightbulb" className="size-4 shrink-0 text-warning" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-text">{t("studio.chips.hints")}</div>
                      <div className="truncate text-[11px] text-text-muted">{t("studio.chips.hintsHint")}</div>
                    </div>
                  </div>
                </div>

                <fieldset className="mt-6">
                  <legend className="text-sm font-bold text-text">{t("styles.legend")}</legend>
                  <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {STYLES.map((option) => {
                      const active = style === option;
                      return (
                        <label
                          key={option}
                          className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 text-left transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                            active
                              ? "border-primary bg-primary-soft/70 shadow-sm"
                              : "border-border bg-bg-elevated hover:-translate-y-0.5 hover:border-border-strong"
                          }`}
                        >
                          <input
                            type="radio"
                            name="ai-chat-style"
                            value={option}
                            checked={active}
                            onChange={() => setStyle(option)}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <span
                              className={`grid size-8 place-items-center rounded-lg transition-colors ${
                                active ? "bg-primary text-white" : "bg-surface text-primary-text group-hover:bg-primary-soft"
                              }`}
                            >
                              <Icon name={STYLE_ICONS[option]} className="size-4" />
                            </span>
                            <span
                              className={`grid size-4 place-items-center rounded-full border transition-colors ${
                                active ? "border-primary bg-primary text-white" : "border-border-strong bg-surface"
                              }`}
                            >
                              {active && <Icon name="check" className="size-2.5" />}
                            </span>
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-text">{t(`styles.${option}.title`)}</span>
                            <span className="mt-1 block text-[12.5px] leading-snug text-text-muted">
                              {t(`styles.${option}.desc`)}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <Button size="lg" onClick={() => setMode("live")} leftIcon={<Icon name="mic" />}>
                    {t("intro.start")} <CreditCost action={AI_ACTION_LESSON_CHAT} />
                  </Button>
                  <Button variant="ghost" size="lg" onClick={() => setMode("text")} leftIcon={<Icon name="keyboard" />}>
                    {t("intro.useText")} <CreditCost action={AI_ACTION_LESSON_CHAT} />
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
      </div>

      <HistoryDialog lessonId={lessonId} open={historyOpen} onClose={() => setHistoryOpen(false)} onOpenSession={openReview} />
    </section>
  );
}
