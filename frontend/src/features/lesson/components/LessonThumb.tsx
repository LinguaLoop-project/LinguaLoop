import YouTubeLogo from "@/components/common/YouTubeLogo";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { formatDuration } from "@/lib/format";
import type { LessonSummary } from "../types";

const TAG = "absolute inline-flex h-6 items-center gap-1 rounded-sm bg-bg-elevated px-2 text-xs font-semibold text-text [&>svg]:h-4 [&>svg]:w-4";

/** Ảnh bìa bài học (`.l-thumb`): nền chuyển sắc primary-soft, icon lớn (khi chưa có ảnh); `corners` thêm huy hiệu và thẻ nguồn/thời lượng. */
export default function LessonThumb({ lesson, corners = true, compact = false, className = "" }: { lesson: LessonSummary; corners?: boolean; compact?: boolean; className?: string }) {
  const { t } = useTranslation("pages");
  const isYouTube = lesson.sourceType?.toLowerCase() === "youtube";
  return (
    <div className={`relative grid aspect-video place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--primary-soft),transparent)] text-primary-text ${className}`}>
      {lesson.thumbnailUrl ? (
        <img
          src={lesson.thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      ) : (
        <Icon name="headphones" className={`transition-transform duration-200 group-hover:scale-[1.08] ${compact ? "h-7 w-7" : "h-11 w-11"}`} />
      )}
      {corners && (
        <>
          <span className="absolute left-2.5 top-2.5 flex gap-1.5">
            {lesson.pro && (
              <Badge variant="pro" solid>
                <Icon name="crown" />
                PRO
              </Badge>
            )}
            {lesson.difficulty && <Badge variant={String(lesson.difficulty)} solid>{lesson.difficulty}</Badge>}
          </span>
          <span className={`${TAG} bottom-2 left-2`}>
            {isYouTube ? <YouTubeLogo /> : <Icon name="audio-lines" />}
            {isYouTube ? "YouTube" : t("student.lessons.card.audio", "Audio")}
          </span>
          <span className={`${TAG} bottom-2 right-2`}>
            <Icon name="clock" />
            {formatDuration(lesson.durationSec ?? 0)}
          </span>
        </>
      )}
    </div>
  );
}
