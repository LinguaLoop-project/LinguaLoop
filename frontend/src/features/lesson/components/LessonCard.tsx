import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LessonSummary } from "../types";
import Badge from "@/components/common/Badge";
import GlassTag from "@/components/common/GlassTag";
import Icon from "@/components/common/Icon";
import { formatCount, formatDuration } from "@/lib/format";
import ModeButton, { type PracticeMode } from "./ModeButton";

interface LessonCardProps {
  lesson: LessonSummary;
}

export const LessonCard = ({ lesson }: LessonCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("pages");

  const isYouTube = lesson.sourceType?.toLowerCase() === "youtube";
  const open = (suffix = "") => navigate(`/student/lessons/${lesson.slug}${suffix}`);
  const modeLabel = (mode: PracticeMode) =>
    t(`student.lessons.card.${mode}`, mode === "dictation" ? "Nghe chép" : "Shadowing");

  return (
    <article
      className="group relative isolate flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      data-lesson={lesson.slug}
      tabIndex={0}
      aria-label={t("student.lessons.card.aria", { title: lesson.title, defaultValue: `Bài ${lesson.title}` })}
      onClick={() => open()}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="relative isolate grid aspect-video place-items-center overflow-hidden border-b border-border bg-primary-soft">
        {lesson.thumbnailUrl ? (
          <img
            src={lesson.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <Icon name="headphones" className="text-[44px] text-primary-text" />
        )}

        <div className="absolute left-2.5 top-2.5 z-30 flex items-center gap-1.5">
          {lesson.pro && (
            <Badge variant="pro">
              <Icon name={lesson.locked ? "lock" : "crown"} fill={!lesson.locked} />
              PRO
            </Badge>
          )}
          <GlassTag title={t("student.lessons.card.views", "Lượt học")}>
            <Icon name="headphones" />
            {formatCount(lesson.viewCount || 0)}
          </GlassTag>
        </div>

        <div className="absolute right-2.5 top-2.5 z-30">
          {lesson.difficulty && <Badge variant={String(lesson.difficulty)}>{lesson.difficulty}</Badge>}
        </div>

        <div className="absolute bottom-2.5 left-2.5 z-30">
          <GlassTag>
            {isYouTube ? (
              <>
                <Icon name="video" className="text-danger" />
                YouTube
              </>
            ) : (
              <>
                <Icon name="audio-lines" className="text-primary-text" />
                Audio
              </>
            )}
          </GlassTag>
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-30">
          <GlassTag>
            <Icon name="clock" />
            {formatDuration(lesson.durationSec ?? 0)}
          </GlassTag>
        </div>
      </div>

      <div className="relative z-20 flex flex-1 flex-col gap-1 p-4 pb-4 pt-3.5">
        <h3 className="line-clamp-2 font-body text-[16px] font-semibold leading-[1.35] text-text sm:text-[17px]">{lesson.title}</h3>
        <div className="truncate text-xs text-text-muted sm:text-sm">
          {i18n.language === "vi" && lesson.titleVi
            ? lesson.titleVi
            : t("student.lessons.card.sentences", { count: lesson.sentenceCount, defaultValue: `${lesson.sentenceCount} câu` })}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          {(["dictation", "shadowing"] as const).map((mode) => (
            <ModeButton
              key={mode}
              mode={mode}
              label={modeLabel(mode)}
              ariaLabel={`${modeLabel(mode)}: ${lesson.title}`}
              percent={mode === "dictation" ? lesson.progress.dictationPercent : lesson.progress.shadowingPercent}
              onClick={(e) => {
                e.stopPropagation();
                open(`?mode=${mode}`);
              }}
            />
          ))}
        </div>
      </div>
    </article>
  );
};

/** Khung chờ cùng hình dạng thẻ bài để trang không nhảy bố cục khi dữ liệu về. */
export const LessonCardSkeleton = () => (
  <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-border bg-surface">
    <div className="skeleton aspect-video bg-surface-hover" />
    <div className="flex flex-col gap-2.5 p-4">
      <div className="skeleton h-4 w-4/5 rounded bg-surface-hover" />
      <div className="skeleton h-3 w-2/5 rounded bg-surface-hover" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="skeleton h-10 rounded-md bg-surface-hover" />
        <div className="skeleton h-10 rounded-md bg-surface-hover" />
      </div>
    </div>
  </div>
);
