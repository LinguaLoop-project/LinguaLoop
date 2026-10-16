import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LessonSummary } from "../types";
import Badge from "../../../components/common/Badge";
import GlassTag from "../../../components/common/GlassTag";
import Icon from "@/components/common/Icon";

interface LessonCardProps {
  lesson: LessonSummary;
}

const fmtNum = (n: number) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return n.toString();
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export const LessonCard = ({ lesson }: LessonCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("pages");

  const isPro = lesson.pro;
  const isYouTube = lesson.sourceType?.toLowerCase() === "youtube";

  const handleCardClick = () => {
    navigate(`/student/lessons/${lesson.slug}`);
  };

  const handleStartMode = (
    e: React.MouseEvent,
    mode: "dictation" | "shadowing",
  ) => {
    e.stopPropagation();
    navigate(`/student/lessons/${lesson.slug}?mode=${mode}`);
  };

  return (
    <article
      className=" group relative isolate flex flex-col overflow-hidden rounded-[20px] p-0 bg-surface border border-border shadow-[var(--shadow-card)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--primary)_65%,var(--border))] hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_20px_45px_-15px_rgba(0,0,0,0.7),0_0_35px_color-mix(in_srgb,var(--primary)_45%,transparent),0_0_70px_color-mix(in_srgb,var(--primary)_35%,transparent),0_0_110px_color-mix(in_srgb,var(--primary)_20%,transparent)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary "
      data-lesson={lesson.slug}
      tabIndex={0}
      aria-label={t("student.lessons.card.aria", {
        title: lesson.title,
        defaultValue: `Bài ${lesson.title}`,
      })}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-video grid place-items-center isolate overflow-hidden border-b border-border bg-[radial-gradient(120%_100%_at_25%_10%,var(--primary-soft),transparent_60%)] bg-surface-hover">
        {lesson.thumbnailUrl ? (
          <img
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <>
            {/* ── Fallback khi không có thumbnail hoặc ảnh lỗi ── */}
            <div className="absolute inset-0 z-10 bg-primary-soft mix-blend-luminosity transition-opacity duration-250 pointer-events-none group-hover:opacity-0" />
            <Icon name="headphones" className="relative z-10 text-[42px] sm:text-[44px] text-accent drop-shadow-[0_0_14px_color-mix(in_srgb,var(--primary)_60%,transparent)] transition-transform duration-500 ease-out group-hover:scale-105" />
          </>
        )}

        {/* ── Corners ── */}
        <div className="absolute z-30 top-2.5 left-2.5 flex items-center gap-1.5">
          {isPro && (
            <Badge variant="pro">
              <Icon name={lesson.locked ? "lock" : "crown"} fill={!lesson.locked} />
              PRO
            </Badge>
          )}
          <GlassTag title={t("student.lessons.card.views", "Lượt học")}>
            <Icon name="headphones" />
            {fmtNum(lesson.viewCount || 0)}
          </GlassTag>
        </div>

        <div className="absolute z-30 top-2.5 right-2.5 flex items-center gap-1.5">
          {lesson.difficulty && (
            <Badge variant={String(lesson.difficulty)}>
              {lesson.difficulty}
            </Badge>
          )}
        </div>

        <div className="absolute z-30 bottom-2.5 left-2.5 flex items-center gap-1.5">
          <GlassTag>
            {isYouTube ? (
              <>
                <Icon name="video" className="text-danger" />YouTube
              </>
            ) : (
              <>
                <Icon name="audio-lines" className="text-accent" />Audio
              </>
            )}
          </GlassTag>
        </div>

        <div className="absolute z-30 bottom-2.5 right-2.5 flex items-center gap-1.5">
          <GlassTag>
            <Icon name="clock" />
            {formatDuration(lesson.durationSec ?? 0)}
          </GlassTag>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col gap-1 p-3.5 pb-4 px-4 relative z-20">
        <h3 className="font-body font-semibold text-[16px] sm:text-[17px] leading-[1.35] text-text line-clamp-2">
          {lesson.title}
        </h3>
        <div className="text-xs sm:text-sm text-text-muted truncate">
          {i18n.language === "vi" && lesson.titleVi
            ? lesson.titleVi
            : t("student.lessons.card.sentences", {
                count: lesson.sentenceCount,
                defaultValue: `${lesson.sentenceCount} câu`,
              })}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-auto pt-3">
          <button
            className="relative flex items-center justify-center gap-1.5 min-h-10 px-2 rounded-md border border-border-strong text-xs sm:text-sm font-semibold text-text-muted hover:bg-primary-soft hover:border-primary hover:text-text transition-colors duration-150 cursor-pointer [&>svg]:text-base sm:[&>svg]:text-lg"
            data-start="dictation"
            data-lesson={lesson.slug}
            aria-label={`${t("student.lessons.card.dictation", "Nghe chép")}: ${lesson.title}`}
            onClick={(e) => handleStartMode(e, "dictation")}
          >
            <Icon name="headphones" />
            {t("student.lessons.card.dictation", "Nghe chép")}
          </button>
          <button
            className="relative flex items-center justify-center gap-1.5 min-h-10 px-2 rounded-md border border-border-strong text-xs sm:text-sm font-semibold text-text-muted hover:bg-primary-soft hover:border-primary hover:text-text transition-colors duration-150 cursor-pointer [&>svg]:text-base sm:[&>svg]:text-lg"
            data-start="shadowing"
            data-lesson={lesson.slug}
            aria-label={`${t("student.lessons.card.shadowing", "Shadowing")}: ${lesson.title}`}
            onClick={(e) => handleStartMode(e, "shadowing")}
          >
            <Icon name="mic" />
            {t("student.lessons.card.shadowing", "Shadowing")}
          </button>
        </div>
      </div>
    </article>
  );
};
