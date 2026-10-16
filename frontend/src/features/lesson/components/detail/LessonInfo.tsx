import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { formatCount, formatDuration } from "@/lib/format";
import type { LessonDetail } from "../../types";
import { resolveMedia } from "../../utils";

/** Tiêu đề, nhãn thông tin (trình độ, nguồn, thời lượng…) và mô tả của bài. */
export default function LessonInfo({ lesson, topicName }: { lesson: LessonDetail; topicName: string }) {
  const { t } = useTranslation("pages");
  const { isYouTube } = resolveMedia(lesson);
  const duration = formatDuration(lesson.durationSec || 0);
  const meta = "inline-flex items-center gap-1.5 [&>svg]:text-base";

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-text sm:text-3xl">{lesson.title}</h1>
      {lesson.titleVi && <p className="mt-1 text-sm text-text-muted">{lesson.titleVi}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-text-muted">
        {lesson.difficulty && <Badge variant={String(lesson.difficulty)}>{lesson.difficulty}</Badge>}
        {lesson.pro && (
          <Badge variant="pro">
            <Icon name="crown" fill />
            PRO
          </Badge>
        )}
        <span className={meta}>
          {isYouTube ? (
            <>
              <Icon name="video" className="text-danger" />
              YouTube
            </>
          ) : (
            <>
              <Icon name="audio-lines" />
              Audio
            </>
          )}
        </span>
        <span className={meta}>
          <Icon name="clock" />
          {duration}
        </span>
        <span className={meta}>
          <Icon name="list-ordered" />
          {t("student.lessonDetail.sentencesCount", { count: lesson.sentenceCount, defaultValue: `${lesson.sentenceCount} câu` })}
        </span>
        <span className={meta}>
          <Icon name="headphones" />
          {t("student.lessonDetail.viewsCount", {
            count: formatCount(lesson.viewCount || 0),
            defaultValue: `${formatCount(lesson.viewCount || 0)} lượt học`,
          })}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-text-muted">
        {lesson.description ||
          t("student.lessonDetail.descriptionFallback", {
            topic: topicName.toLowerCase(),
            duration,
            count: lesson.sentenceCount,
            defaultValue: `Bài thuộc chủ đề ${topicName.toLowerCase()}, dài ${duration}, cắt sẵn ${lesson.sentenceCount} câu kèm mốc thời gian. Chọn một chế độ để luyện; tiến độ mỗi chế độ được lưu riêng.`,
          })}
      </p>
    </div>
  );
}
