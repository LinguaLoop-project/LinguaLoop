import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { youTubeThumbnail } from "@/lib/youtube";
import { formatDuration, useLessonShowcase, type ShowcaseLesson } from "../api";

type LevelFilter = "all" | "basic" | "intermediate" | "advanced";

const TOPIC_ICONS = [
  "messages-square",
  "plane",
  "briefcase",
  "file-check",
  "clapperboard",
  "newspaper",
  "utensils",
  "heart-pulse",
  "music",
  "graduation-cap",
  "trending-up",
  "leaf",
] as const;

const FILTER_OPTIONS: LevelFilter[] = ["all", "basic", "intermediate", "advanced"];

const SKELETON_CARDS = 6;

function matchesFilter(level: string, filter: LevelFilter): boolean {
  if (filter === "all") return true;
  if (filter === "basic") return level === "A1" || level === "A2";
  if (filter === "intermediate") return level === "B1" || level === "B2";
  return level === "C1" || level === "C2";
}

interface LessonMarqueeProps {
  /** Đường dẫn khi bấm một bài: khách được mời đăng ký, học viên mở chi tiết bài học. */
  lessonHref: (lessonId: string) => string;
}

/**
 * Dải bài học thật của thư viện (BR-TC-20), 2 hàng trôi ngược chiều: thẻ bài và chủ đề. Trong lúc tải hiện khung trống;
 * không tải được hoặc chưa có bài thì ẩn cả phần, không thay bằng bài không có thật (AC-TC-44).
 */
export default function LessonMarquee({ lessonHref }: LessonMarqueeProps) {
  const { t } = useTranslation("landing");
  const [filter, setFilter] = useState<LevelFilter>("all");
  const { data, isPending, isError } = useLessonShowcase();

  const lessons = useMemo(() => data?.lessons ?? [], [data]);
  const topics = data?.topics ?? [];

  // Khi lọc còn ít bài, nhân thêm để dải luôn kín chiều ngang màn hình lớn trước khi nhân đôi vòng lặp.
  const rowItems = useMemo(() => {
    const matched = lessons.filter((item) => matchesFilter(item.cefrLevel, filter));
    const base = matched.length > 0 ? matched : lessons;
    if (base.length === 0 || base.length >= 6) return base;
    return [...base, ...base, ...base];
  }, [lessons, filter]);

  if (isError || (!isPending && lessons.length === 0)) return null;

  return (
    <section aria-labelledby="marquee-heading" className="overflow-x-clip border-b border-border bg-bg-elevated/35 py-14 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
              {t("marquee.eyebrow")}
            </span>
            <h2 id="marquee-heading" className="mt-2 font-display text-2xl font-bold leading-tight text-text sm:text-4xl">
              {t("marquee.title")}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-text-muted sm:text-base">{t("marquee.subtitle")}</p>
          </div>

          {/* Bộ lọc cấp độ CEFR nhanh */}
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label={t("marquee.filterLabel")} className="inline-flex rounded-md border border-border bg-surface p-1">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={filter === opt}
                  onClick={() => setFilter(opt)}
                  className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === opt
                      ? "bg-primary text-white"
                      : "text-text-muted hover:bg-surface-hover hover:text-text"
                  }`}
                >
                  {t(`marquee.filters.${opt}`)}
                </button>
              ))}
            </div>
            <span className="hidden items-center gap-1.5 text-xs text-text-subtle xl:inline-flex">
              <Icon name="pause" className="text-[11px]" />
              {t("marquee.pauseHint")}
            </span>
          </div>
        </div>
      </div>

      {/* Hàng 1: Thẻ bài học trôi phải → trái */}
      <div className="marquee-group marquee-mask mt-8 overflow-hidden">
        {isPending ? (
          <div className="flex w-max gap-4 px-4 py-1.5" aria-busy="true" aria-label={t("marquee.loading")}>
            {Array.from({ length: SKELETON_CARDS }, (_, i) => (
              <div key={i} className="skeleton h-[268px] w-[285px] shrink-0 rounded-xl border border-border sm:w-[315px]" />
            ))}
          </div>
        ) : (
          <div key={filter} className="marquee-track animate-marquee-left flex w-max gap-4 py-1.5">
            {[0, 1].map((dup) => (
              <div key={dup} aria-hidden={dup === 1 || undefined} className="flex shrink-0 gap-4">
                {rowItems.map((lesson, idx) => (
                  <LessonCard key={`${dup}-${lesson.id}-${idx}`} lesson={lesson} href={lessonHref(lesson.id)} hidden={dup === 1} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hàng 2: Dải chip chủ đề trôi ngược trái → phải */}
      {topics.length > 0 && (
        <div className="marquee-group marquee-mask mt-4 overflow-hidden">
          <div className="marquee-track animate-marquee-right flex w-max gap-3 py-1">
            {[0, 1].map((dup) => (
              <div key={dup} aria-hidden={dup === 1 || undefined} className="flex shrink-0 gap-3">
                {topics.map((topic, idx) => (
                  <span
                    key={`${dup}-${topic}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-4 py-2 text-xs font-semibold text-text-muted transition-colors hover:border-border-strong hover:text-text"
                  >
                    <Icon name={TOPIC_ICONS[idx % TOPIC_ICONS.length]} className="text-sm text-primary-text" />
                    {topic}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function LessonCard({ lesson, href, hidden }: { lesson: ShowcaseLesson; href: string; hidden: boolean }) {
  const { t } = useTranslation("landing");
  return (
    <Link
      to={href}
      tabIndex={hidden ? -1 : undefined}
      className="group flex w-[285px] shrink-0 flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface no-underline shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 sm:w-[315px]"
    >
      <div>
        {/* Ảnh bìa 16:9 lấy từ chính video YouTube của bài */}
        <div className="relative aspect-video w-full overflow-hidden bg-bg-elevated">
          <img
            src={youTubeThumbnail(lesson.youtubeId)}
            alt={hidden ? "" : lesson.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-105"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07050D]/80 via-[#07050D]/15 to-transparent"
          />
          {/* Nút play mờ hiện rõ khi rê chuột */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-[#07050D]/65 text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:scale-105 group-hover:opacity-100"
          >
            <Icon name="play" fill className="ml-0.5 text-sm" />
          </span>
          {/* Cấp độ CEFR và nhãn Pro góc trên trái */}
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Badge variant={lesson.cefrLevel} solid>
              {lesson.cefrLevel}
            </Badge>
            {lesson.pro && (
              <Badge variant="pro" solid>
                <Icon name="crown" />
                Pro
              </Badge>
            )}
          </div>
          {/* Thời lượng góc dưới phải */}
          <span className="absolute bottom-2.5 right-3 inline-flex items-center gap-1 rounded-sm bg-[#07050D]/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-white backdrop-blur-xs">
            <Icon name="clock" className="text-[10px] text-primary-text" />
            {formatDuration(lesson.durationSec)}
          </span>
        </div>

        <div className="p-4 pb-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
            {lesson.topicName && (
              <>
                <span className="truncate">{lesson.topicName}</span>
                <span>•</span>
              </>
            )}
            <span className="shrink-0">{t("marquee.sentencesUnit", { count: lesson.sentenceCount })}</span>
          </div>

          <h3 className="mt-2 line-clamp-2 font-display text-[15px] font-bold leading-snug text-text transition-colors group-hover:text-primary-text">
            {lesson.title}
          </h3>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border px-4 py-3 text-xs font-semibold text-text-muted">
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-fn-dictation">
            <Icon name="headphones" className="text-sm" />
            {t("marquee.dictation")}
          </span>
          <span className="inline-flex items-center gap-1 text-fn-shadowing">
            <Icon name="mic" className="text-sm" />
            {t("marquee.shadowing")}
          </span>
        </span>
        <Icon name="arrow-right" className="text-sm transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary-text" />
      </div>
    </Link>
  );
}
