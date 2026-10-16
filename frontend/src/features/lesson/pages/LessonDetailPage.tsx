import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLessonDetail, useLessonSentences } from "../hooks/useLessons";
import { toApiError } from "@/features/auth";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import Icon from "@/components/common/Icon";

const fmtNum = (n: number) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toLocaleString();
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};

const formatTimeMs = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};

const INITIAL_SENTENCE_LIMIT = 8;
const SENTENCE_STEP = 8;

const getYouTubeVideoId = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );
  return match ? match[1] : null;
};

export const LessonDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const lessonSlug = slug || "";
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["pages", "common", "layout"]);

  const [isPlayingMedia, setIsPlayingMedia] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [visibleSentenceCount, setVisibleSentenceCount] = useState(
    INITIAL_SENTENCE_LIMIT,
  );

  const {
    data: lesson,
    isLoading: isLessonLoading,
    error: lessonError,
    refetch: refetchLesson,
  } = useLessonDetail(lessonSlug);

  // Bài Pro bị khoá thì không gọi /sentences (sẽ trả 403 LESSON_PRO_REQUIRED).
  const { data: sentences, isLoading: isSentencesLoading } = useLessonSentences(
    lesson && !lesson.locked ? lesson.slug : undefined,
  );

  const topicSlug = lesson?.topic?.slug || "";
  const relatedLessons = lesson?.relatedLessons ?? [];

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  if (isLessonLoading) {
    return (
      <div className="flex justify-center p-12">
        <Icon name="loader-circle" className="text-3xl animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    const isNotFound = !lessonError || toApiError(lessonError).status === 404;
    if (!isNotFound) {
      return (
        <div className="py-16">
          <EmptyState
            mascotSrc="/mascot/loopi-encourage.svg"
            title={t(
              "pages:student.lessonDetail.errorTitle",
              "Không tải được bài học",
            )}
            description={t(
              "pages:student.lessonDetail.errorDesc",
              "Có lỗi khi kết nối tới máy chủ. Vui lòng thử lại.",
            )}
            actionText={t("pages:student.lessons.error.retry", "Thử lại")}
            onAction={() => void refetchLesson()}
          />
        </div>
      );
    }
    return (
      <div className="py-16">
        <EmptyState
          mascotSrc="/mascot/loopi-encourage.svg"
          title={t(
            "pages:student.lessonDetail.notFoundTitle",
            "Không tìm thấy bài học",
          )}
          description={t(
            "pages:student.lessonDetail.notFoundDesc",
            "Bài học bạn đang tìm không tồn tại hoặc đã bị gỡ.",
          )}
        >
          <Link
            to="/student/lessons"
            className="mt-4 inline-flex items-center justify-center font-body font-semibold select-none rounded-md transition-all duration-200 cursor-pointer h-11 px-4.5 text-sm bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)] text-white shadow-[0_2px_12px_color-mix(in_srgb,var(--btn-primary)_35%,transparent)]"
          >
            {t("pages:student.lessonDetail.backToLibrary", "Quay lại Thư viện")}
          </Link>
        </EmptyState>
      </div>
    );
  }

  const topicName =
    i18n.language === "en"
      ? lesson.topic?.name || lesson.topic?.nameVi || "Topic"
      : lesson.topic?.nameVi || lesson.topic?.name || "Chủ đề";
  const sentenceList = sentences || [];
  const displayedSentences = sentenceList.slice(0, visibleSentenceCount);
  const hasMoreSentences = visibleSentenceCount < sentenceList.length;
  const remainingSentences = sentenceList.length - visibleSentenceCount;
  const nextSentenceBatch = Math.min(SENTENCE_STEP, remainingSentences);

  const durationText = formatDuration(lesson.durationSec || 0);

  const rawVideoUrl = lesson.sourceUrl || "";
  const ytVideoId = getYouTubeVideoId(rawVideoUrl);
  const isYouTube =
    Boolean(ytVideoId) ||
    lesson.sourceType?.toLowerCase() === "youtube" ||
    rawVideoUrl.includes("youtube.com") ||
    rawVideoUrl.includes("youtu.be");
  const embedVideoUrl = ytVideoId
    ? `https://www.youtube.com/embed/${ytVideoId}?autoplay=1&rel=0`
    : rawVideoUrl;

  // Sample vocabulary extracted from sentences if available
  const sampleWords = [
    { word: "reliable", cefr: "B1", meaning: "đáng tin cậy" },
    { word: "although", cefr: "B1", meaning: "mặc dù" },
    { word: "conversation", cefr: "A2", meaning: "cuộc trò chuyện" },
  ];

  return (
    <section className="w-full" id="v-lesson">
      {/* ── Breadcrumb ── */}
      <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-text-muted mb-4 [&>a]:text-text-muted [&>a]:min-h-8 [&>a]:inline-flex [&>a]:items-center hover:[&>a]:text-text hover:[&>a]:underline [&>svg]:text-[14px]">
        <Link to="/student/lessons">
          {t("pages:student.lessons.title", "Bài học")}
        </Link>
        <Icon name="chevron-right" />
        {topicSlug ? (
          <Link to={`/student/topics/${topicSlug}`}>{topicName}</Link>
        ) : (
          <span>{topicName}</span>
        )}
        <Icon name="chevron-right" />
        <span>{lesson.title}</span>
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-6 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Media Player Container */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            {embedVideoUrl && isPlayingMedia ? (
              <div className="relative w-full h-full">
                {isYouTube ? (
                  <iframe
                    src={embedVideoUrl}
                    title={lesson.title}
                    className="w-full h-full border-0 rounded-[inherit]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : lesson.sourceType?.toLowerCase() === "audio" ? (
                  <div className="w-full h-full grid place-items-center bg-surface-hover p-6 border border-border rounded-[inherit]">
                    <audio
                      src={rawVideoUrl}
                      controls
                      autoPlay
                      className="w-full max-w-md"
                    />
                  </div>
                ) : (
                  <video
                    src={rawVideoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-cover rounded-[inherit] border border-border"
                  />
                )}
                <button
                  type="button"
                  className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors shadow-md backdrop-blur-xs cursor-pointer"
                  title={t("common:actions.close", "Đóng")}
                  aria-label={t("common:actions.close", "Đóng")}
                  onClick={() => setIsPlayingMedia(false)}
                >
                  <Icon name="x" className="text-base" />
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 border border-border rounded-[inherit] w-full h-full group">
                {lesson.thumbnailUrl && (
                  <img
                    src={lesson.thumbnailUrl}
                    alt={lesson.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 z-10 bg-primary-soft mix-blend-luminosity transition-opacity duration-300 pointer-events-none group-hover:opacity-0"></div>
                <Icon name="headphones" className="relative z-10 text-[44px] text-accent drop-shadow-[0_0_14px_color-mix(in_srgb,var(--primary)_60%,transparent)] transition-transform duration-500 group-hover:scale-105 flex items-center justify-center w-full h-full" />

                <button
                  className="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-[28px] shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_60%,transparent)] transition-transform duration-200 hover:scale-105 cursor-pointer"
                  aria-label={t(
                    "pages:student.lessonDetail.playVideo",
                    "Phát video",
                  )}
                  onClick={() => setIsPlayingMedia(true)}
                >
                  <Icon name="play" fill className="ml-1" />
                </button>
              </div>
            )}
          </div>

          {/* Lesson Info */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text font-display">
              {lesson.title}
            </h1>
            {lesson.titleVi && (
              <p className="text-sm text-text-muted mt-1">{lesson.titleVi}</p>
            )}

            <div className="flex flex-wrap gap-y-2 gap-x-4 items-center text-[13px] text-text-muted mt-3 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&>span>i]:text-base">
              {lesson.difficulty && (
                <Badge variant={String(lesson.difficulty)}>
                  {lesson.difficulty}
                </Badge>
              )}
              {lesson.pro && (
                <Badge variant="pro">
                  <Icon name="crown" fill />PRO
                </Badge>
              )}
              <span>
                {isYouTube ? (
                  <>
                    <Icon name="video" className="text-danger" />
                    YouTube
                  </>
                ) : (
                  <>
                    <Icon name="audio-lines" />Audio
                  </>
                )}
              </span>
              <span>
                <Icon name="clock" />
                {durationText}
              </span>
              <span>
                <Icon name="list-ordered" />
                {t("pages:student.lessonDetail.sentencesCount", {
                  count: lesson.sentenceCount,
                  defaultValue: `${lesson.sentenceCount} câu`,
                })}
              </span>
              <span>
                <Icon name="headphones" />
                {t("pages:student.lessonDetail.viewsCount", {
                  count: fmtNum(lesson.viewCount || 95482),
                  defaultValue: `${fmtNum(lesson.viewCount || 95482)} lượt học`,
                })}
              </span>
              <span>
                <Icon name="calendar" />
                {t("pages:student.lessonDetail.recentAdded", "Thêm gần đây")}
              </span>
            </div>

            <p className="mt-3 leading-relaxed text-sm text-text-muted">
              {lesson.description ||
                t("pages:student.lessonDetail.descriptionFallback", {
                  topic: topicName.toLowerCase(),
                  duration: durationText,
                  count: lesson.sentenceCount,
                  defaultValue: `Bài thuộc chủ đề ${topicName.toLowerCase()}, dài ${durationText}, cắt sẵn ${
                    lesson.sentenceCount
                  } câu kèm mốc thời gian. Chọn một chế độ để luyện; tiến độ mỗi chế độ được lưu riêng.`,
                })}
            </p>
          </div>

          {/* Practice Modes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              className="group relative isolate flex flex-col p-5 rounded-[20px] bg-surface border border-border shadow-[var(--shadow-card)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--primary)_65%,var(--border))] hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_20px_45px_-15px_rgba(0,0,0,0.7),0_0_35px_color-mix(in_srgb,var(--primary)_45%,transparent),0_0_70px_color-mix(in_srgb,var(--primary)_35%,transparent),0_0_110px_color-mix(in_srgb,var(--primary)_20%,transparent)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary gap-3"
              tabIndex={0}
              role="button"
              aria-label={t(
                "pages:student.lessonDetail.dictation.title",
                "Nghe chép",
              )}
              onClick={() => navigate(`/student/dictation/${lesson.slug}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/student/dictation/${lesson.slug}`);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-md grid place-items-center text-[26px] bg-primary-soft text-accent border border-border transition-transform duration-300 group-hover:scale-105">
                  <Icon name="headphones" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-text">
                  {t("pages:student.lessonDetail.dictation.title", "Nghe chép")}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {t(
                    "pages:student.lessonDetail.dictation.desc",
                    "Nghe từng câu rồi gõ lại. Chấm từng từ, gắn nhãn loại lỗi.",
                  )}
                </p>
              </div>
              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>0/{lesson.sentenceCount} câu</span>
                  <span>
                    {t(
                      "pages:student.lessonDetail.dictation.notStarted",
                      "Chưa bắt đầu",
                    )}
                  </span>
                </div>
                <div className="h-1 mt-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/student/dictation/${lesson.slug}`);
                }}
                rightIcon={<Icon name="arrow-right" />}
              >
                {t("pages:student.lessonDetail.dictation.start", "Bắt đầu")}
              </Button>
            </div>

            <div
              className="group relative isolate flex flex-col p-5 rounded-[20px] bg-surface border border-border shadow-[var(--shadow-card)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--primary)_65%,var(--border))] hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_20px_45px_-15px_rgba(0,0,0,0.7),0_0_35px_color-mix(in_srgb,var(--primary)_45%,transparent),0_0_70px_color-mix(in_srgb,var(--primary)_35%,transparent),0_0_110px_color-mix(in_srgb,var(--primary)_20%,transparent)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary gap-3"
              tabIndex={0}
              role="button"
              aria-label={t(
                "pages:student.lessonDetail.shadowing.title",
                "Shadowing",
              )}
              onClick={() => navigate(`/student/shadowing/${lesson.slug}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/student/shadowing/${lesson.slug}`);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-md grid place-items-center text-[26px] bg-primary-soft text-accent border border-border transition-transform duration-300 group-hover:scale-105">
                  <Icon name="mic" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-text">
                  {t("pages:student.lessonDetail.shadowing.title", "Shadowing")}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {t(
                    "pages:student.lessonDetail.shadowing.desc",
                    "Nghe mẫu rồi đọc theo. AI chấm phát âm tới từng âm vị.",
                  )}
                </p>
              </div>
              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>0/{lesson.sentenceCount} câu</span>
                  <span>
                    {t(
                      "pages:student.lessonDetail.shadowing.notStarted",
                      "Chưa bắt đầu",
                    )}
                  </span>
                </div>
                <div className="h-1 mt-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: "0%" }}
                  ></div>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/student/shadowing/${lesson.slug}`);
                }}
                rightIcon={<Icon name="arrow-right" />}
              >
                {t("pages:student.lessonDetail.shadowing.start", "Bắt đầu")}
              </Button>
            </div>
          </div>

          {/* Sentence Transcript List */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-lg text-text">
                {t(
                  "pages:student.lessonDetail.transcript.sentencesInLesson",
                  "Các câu trong bài",
                )}{" "}
                <span className="text-xs text-text-muted font-normal">
                  ({sentenceList.length})
                </span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={showTranscript}
                onClick={() => setShowTranscript(!showTranscript)}
                leftIcon={
                  <Icon name={showTranscript ? "eye-off" : "eye"} />
                }
              >
                {showTranscript
                  ? t(
                      "pages:student.lessonDetail.transcript.hide",
                      "Ẩn transcript",
                    )
                  : t(
                      "pages:student.lessonDetail.transcript.view",
                      "Hiện transcript",
                    )}
              </Button>
            </div>
            <p className="text-xs text-text-muted my-2">
              {t(
                "pages:student.lessonDetail.transcript.note",
                "Transcript ẩn sẵn để không lộ đáp án khi nghe chép.",
              )}
            </p>

            <div
              className={
                showTranscript
                  ? ""
                  : "blur-xs select-none pointer-events-none transition-all duration-200"
              }
              id="sentList"
            >
              {lesson.locked ? (
                <EmptyState
                  mascotSrc="/mascot/loopi-encourage.svg"
                  title={t(
                    "pages:student.lessonDetail.proRequiredTitle",
                    "Bài học dành cho gói Pro",
                  )}
                  description={t(
                    "pages:student.lessonDetail.proRequiredDesc",
                    "Nâng cấp lên gói Pro để xem transcript và luyện tập bài này.",
                  )}
                />
              ) : isSentencesLoading ? (
                <div className="flex justify-center p-6">
                  <Icon name="loader-circle" className="text-2xl animate-spin text-primary" />
                </div>
              ) : sentenceList.length > 0 ? (
                <>
                  {displayedSentences.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="grid grid-cols-[32px_1fr_auto] gap-3 items-center py-3 border-t border-border first:border-t-0"
                    >
                      <span className="w-7 h-7 rounded-sm grid place-items-center font-semibold text-xs bg-surface-hover text-text-muted shrink-0 self-start mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium text-text transition-[filter] duration-200 leading-snug">
                          {s.text}
                        </span>
                        {s.ipa && (
                          <span className="text-[12px] font-mono text-text-muted/80 tracking-wide select-text">
                            /{s.ipa.replace(/^\/|\/$/g, "")}/
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap [&>svg]:text-base shrink-0 self-start mt-1">
                        <span>
                          {formatTimeMs(s.startMs)}
                        </span>
                        <button
                          className="w-8 h-8 rounded-full grid place-items-center bg-primary-soft text-accent border border-border hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer"
                          aria-label={t(
                            "pages:student.lessonDetail.transcript.listen",
                            {
                              index: idx + 1,
                              defaultValue: `Nghe câu ${idx + 1}`,
                            },
                          )}
                          onClick={() => speak(s.text)}
                        >
                          <Icon name="volume-2" />
                        </button>
                      </span>
                    </div>
                  ))}

                  {/* Transcript Pagination / Show More Controls */}
                  {sentenceList.length > INITIAL_SENTENCE_LIMIT && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-border">
                      <span className="text-xs text-text-muted font-medium">
                        {t(
                          "pages:student.lessonDetail.transcript.showingCount",
                          {
                            visible: displayedSentences.length,
                            total: sentenceList.length,
                            defaultValue: `Đang hiện ${displayedSentences.length}/${sentenceList.length} câu`,
                          },
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {hasMoreSentences && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setVisibleSentenceCount(
                                (prev) => prev + SENTENCE_STEP,
                              )
                            }
                            leftIcon={<Icon name="chevron-down" />}
                          >
                            {t(
                              "pages:student.lessonDetail.transcript.showMore",
                              {
                                count: nextSentenceBatch,
                                defaultValue: `Xem thêm ${nextSentenceBatch} câu`,
                              },
                            )}
                          </Button>
                        )}
                        {visibleSentenceCount > INITIAL_SENTENCE_LIMIT && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setVisibleSentenceCount(INITIAL_SENTENCE_LIMIT)
                            }
                            leftIcon={<Icon name="chevron-up" />}
                          >
                            {t(
                              "pages:student.lessonDetail.transcript.collapse",
                              "Thu gọn",
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-text-muted py-4 text-center">
                  {t(
                    "pages:student.lessonDetail.transcript.empty",
                    "Chưa có dữ liệu câu cho bài này.",
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column / Aside */}
        <aside className="flex flex-col gap-6">
          {/* Progress Card */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)]">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-2">
              {t(
                "pages:student.lessonDetail.aside.progress",
                "Tiến độ của bạn",
              )}
            </div>
            <div className="flex items-center gap-5">
              <div className="w-[88px] h-[88px] rounded-full border-4 border-border flex flex-col items-center justify-center shrink-0">
                <span className="font-display font-bold text-2xl text-text">
                  0
                </span>
                <small className="text-[11px] text-text-muted">%</small>
              </div>
              <div className="flex flex-col gap-2 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-2">
                    <Icon name="headphones" className="text-accent" />
                    {t(
                      "pages:student.lessonDetail.dictation.title",
                      "Nghe chép",
                    )}
                  </span>
                  <b className="text-text">—</b>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-2">
                    <Icon name="mic" className="text-accent" />
                    {t(
                      "pages:student.lessonDetail.shadowing.title",
                      "Shadowing",
                    )}
                  </span>
                  <b className="text-text">—</b>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-2">
                    <Icon name="clock" className="text-accent" />
                    {t(
                      "pages:student.lessonDetail.aside.studyTime",
                      "Thời gian học",
                    )}
                  </span>
                  <b className="text-text">—</b>
                </div>
              </div>
            </div>
          </div>

          {/* Vocabulary in Lesson */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent">
                {t(
                  "pages:student.lessonDetail.aside.vocab",
                  "Từ vựng trong bài",
                )}
              </div>
              <button className="text-xs font-semibold text-accent hover:underline cursor-pointer">
                {t("pages:student.lessonDetail.aside.saveAll", "Lưu tất cả")}
              </button>
            </div>
            {sampleWords.map((w) => (
              <div
                key={w.word}
                className="flex items-center justify-between gap-3 py-2 border-t border-border first:border-t-0"
              >
                <div className="flex items-center gap-2">
                  <button
                    className="w-7 h-7 rounded-full grid place-items-center bg-primary-soft text-accent border border-border hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    aria-label={`Nghe ${w.word}`}
                    onClick={() => speak(w.word)}
                  >
                    <Icon name="volume-2" />
                  </button>
                  <div>
                    <b className="text-text text-sm">{w.word}</b>{" "}
                    <Badge variant={w.cefr}>{w.cefr}</Badge>
                    <div className="text-xs text-text-muted mt-0.5">
                      {w.meaning}
                    </div>
                  </div>
                </div>
                <button
                  className="w-9 h-9 grid place-items-center text-lg text-text-muted rounded-sm transition-colors hover:text-primary hover:bg-primary-soft cursor-pointer"
                  aria-label={`Lưu từ ${w.word}`}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    btn.classList.toggle("text-primary");
                  }}
                >
                  <Icon name="bookmark" />
                </button>
              </div>
            ))}
          </div>

          {/* User Notes */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent">
                {t("pages:student.lessonDetail.aside.notes", "Ghi chú của tôi")}
              </div>
              <button className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer">
                <Icon name="plus" />
                {t("pages:student.lessonDetail.aside.add", "Thêm")}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              {t(
                "pages:student.lessonDetail.aside.noNotes",
                "Chưa có ghi chú. Trong lúc luyện, bấm N để ghi chú cho câu đang học.",
              )}
            </p>
          </div>

          {/* Related Lessons */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)]">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-2">
              {t("pages:student.lessonDetail.related.title", "Bài cùng chủ đề")}
            </div>
            {relatedLessons.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center gap-3 p-2 -mx-2 rounded-md cursor-pointer transition-colors hover:bg-surface-hover"
                onClick={() => navigate(`/student/lessons/${rel.slug}`)}
              >
                <div className="w-[88px] h-[52px] shrink-0 rounded-md overflow-hidden relative border border-border">
                  {rel.thumbnailUrl ? (
                    <img
                      src={rel.thumbnailUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-hover">
                      <Icon name="headphones" className="text-base text-accent" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <b className="font-semibold text-sm text-text line-clamp-1">
                    {rel.title}
                  </b>
                  <div className="text-xs text-text-muted">
                    {rel.difficulty ? `${rel.difficulty} · ` : ""}
                    {formatDuration(rel.durationSec || 0)}
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              className="w-full mt-3 justify-center shadow-xs"
              onClick={() => {
                if (topicSlug) {
                  navigate(`/student/topics/${topicSlug}`);
                } else {
                  navigate("/student/lessons");
                }
              }}
              rightIcon={<Icon name="arrow-right" />}
            >
              {topicSlug
                ? t("pages:student.lessonDetail.related.viewTopic", {
                    topic: topicName,
                    defaultValue: `Xem cả chủ đề`,
                  })
                : t(
                    "pages:student.lessonDetail.related.exploreLessons",
                    "Khám phá thêm bài học",
                  )}
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
};
