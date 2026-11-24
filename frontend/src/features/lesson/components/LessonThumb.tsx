import type { ReactNode } from "react";
import YouTubeLogo from "@/components/common/YouTubeLogo";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { formatDuration } from "@/lib/format";
import type { LessonSummary } from "../types";
import ModeRails from "./ModeRails";

const TAG =
  "absolute z-10 inline-flex h-6 items-center gap-1 rounded-sm bg-bg-elevated/90 px-2 text-xs font-semibold text-text backdrop-blur-xs [&>svg]:h-4 [&>svg]:w-4";

/** Ảnh bìa bài học (`.l-thumb`): nền chuyển sắc primary-soft, icon lớn (khi chưa có ảnh); `corners` thêm huy hiệu và thẻ nguồn/thời lượng. */
export default function LessonThumb({
  lesson,
  corners = true,
  compact = false,
  playOverlay = false,
  className = "",
  topRight,
}: {
  lesson: LessonSummary;
  corners?: boolean;
  compact?: boolean;
  /** Hiện nút Play glassmorphism ở tâm ảnh khi rê chuột vào thẻ. */
  playOverlay?: boolean;
  className?: string;
  topRight?: ReactNode;
}) {
  const { t } = useTranslation("pages");
  const isYouTube = true;
  const hasProgress =
    corners &&
    lesson.progress &&
    (lesson.progress.dictationPercent > 0 || lesson.progress.shadowingPercent > 0);

  return (
    <div
      className={`relative grid aspect-video place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--primary-soft),transparent)] text-primary-text ${className}`}
    >
      {lesson.thumbnailUrl ? (
        <img
          src={lesson.thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      ) : (
        <Icon
          name="headphones"
          className={`transition-transform duration-300 group-hover:scale-[1.12] ${compact ? "h-7 w-7" : "h-11 w-11"}`}
        />
      )}

      {corners && (
        <>
          {/* Lớp phủ tối dần ở đáy ảnh và vệt sáng lướt chéo khi hover */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.16)_50%,transparent_70%)] transition-transform duration-700 ease-out group-hover:translate-x-full"
          />
        </>
      )}

      {playOverlay && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/0 transition-colors duration-300 group-hover:bg-black/20"
        >
          <span className="grid size-12 scale-75 place-items-center rounded-full border border-white/30 bg-white/90 text-black opacity-0 shadow-[0_12px_28px_rgba(0,0,0,0.45)] backdrop-blur-md transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 group-hover:opacity-100">
            <Icon name={lesson.locked ? "lock" : "play"} fill={!lesson.locked} className={lesson.locked ? "size-5" : "ml-0.5 size-5"} />
          </span>
        </span>
      )}

      {corners && (
        <>
          <span className="absolute left-2.5 top-2.5 z-10 flex gap-1.5">
            {lesson.pro && (
              <Badge variant="pro" solid>
                <Icon name="crown" />
                PRO
              </Badge>
            )}
            {lesson.cefrLevel && (
              <Badge variant={lesson.cefrLevel} solid>
                {lesson.cefrLevel}
              </Badge>
            )}
          </span>
          {topRight && <span className="absolute right-2.5 top-2.5 z-10">{topRight}</span>}
          <span className={`${TAG} ${hasProgress ? "bottom-3" : "bottom-2"} left-2`}>
            {isYouTube ? <YouTubeLogo /> : <Icon name="audio-lines" />}
            {isYouTube ? "YouTube" : t("student.lessons.card.audio", "Audio")}
          </span>
          <span className={`${TAG} ${hasProgress ? "bottom-3" : "bottom-2"} right-2`}>
            <Icon name="clock" />
            {formatDuration(lesson.durationSec ?? 0)}
          </span>
          {hasProgress && (
            <ModeRails progress={lesson.progress} className="z-10 bg-black/60" />
          )}
        </>
      )}
    </div>
  );
}
