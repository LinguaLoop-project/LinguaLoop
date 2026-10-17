import YouTubeLogo from "@/components/common/YouTubeLogo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import type { MascotMood } from "@/components/common/Mascot";
import { formatCount, formatDuration } from "@/lib/format";
import type { LessonDetail } from "../../types";
import { resolveMedia } from "../../utils";
import LessonThumb from "../LessonThumb";

/** Lời Loopi theo tiến độ bài (lessons.html): xong cả hai → ăn mừng, đang học dở → khích lệ, chưa học → chào. */
function sayFor(lesson: LessonDetail, t: (key: string, fallback: string) => string): [MascotMood, string] {
  const { dictationPercent: d, shadowingPercent: s } = lesson.progress;
  if (d >= 100 && s >= 100) return ["celebrate", t("student.lessonDetail.say.done", "Bài này bạn xong rồi, luyện lại cho chắc nhé!")];
  if (d > 0 || s > 0) return ["correct", t("student.lessonDetail.say.doing", "Bạn đang học dở bài này, tiếp tục thôi!")];
  return ["hello", t("student.lessonDetail.say.start", "Chọn một chế độ để bắt đầu nhé!")];
}

function Player({ lesson, onClose }: { lesson: LessonDetail; onClose: () => void }) {
  const { t } = useTranslation(["pages", "common"]);
  const { rawUrl, isYouTube, embedUrl } = resolveMedia(lesson);
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-black">
      {isYouTube ? (
        <iframe
          src={embedUrl}
          title={lesson.title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : lesson.sourceType?.toLowerCase() === "audio" ? (
        <div className="grid h-full w-full place-items-center bg-surface-hover p-6">
          <audio src={rawUrl} controls autoPlay className="w-full max-w-md" />
        </div>
      ) : (
        <video src={rawUrl} controls autoPlay className="h-full w-full object-cover" />
      )}
      <button
        type="button"
        className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-black/60 text-white transition-colors hover:bg-black/90"
        title={t("common:actions.close", "Đóng")}
        aria-label={t("common:actions.close", "Đóng")}
        onClick={onClose}
      >
        <Icon name="x" className="text-base" />
      </button>
    </div>
  );
}

/** Đầu trang chi tiết bài (`.l-head`): ảnh bìa có nút phát, nhãn thông tin, tiêu đề và lời Loopi. */
export default function LessonHead({ lesson }: { lesson: LessonDetail }) {
  const { t, i18n } = useTranslation("pages");
  const [playing, setPlaying] = useState(false);
  const { embedUrl, isYouTube } = resolveMedia(lesson);
  const canPlay = Boolean(embedUrl);
  const [mood, say] = sayFor(lesson, (k, f) => t(k, f));
  const meta = "inline-flex items-center gap-1.5 [&>svg]:h-5 [&>svg]:w-5";
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  return (
    <section className={`grid items-center gap-6 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] ${playing ? "" : "md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]"}`}>
      {playing ? (
        <Player lesson={lesson} onClose={() => setPlaying(false)} />
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <LessonThumb lesson={lesson} className="!h-[164px]" />
          {canPlay && (
            <button
              type="button"
              aria-label={t("student.lessonDetail.playVideo", "Phát video")}
              onClick={() => setPlaying(true)}
              className="absolute left-1/2 top-1/2 -ml-[26px] -mt-[26px] grid h-[52px] w-[52px] cursor-pointer place-items-center rounded-full border-0 bg-[var(--btn-primary)] text-white shadow-[0_4px_0_color-mix(in_srgb,var(--btn-primary)_55%,#000)] transition-transform duration-150 hover:scale-[1.06] active:translate-y-[3px] active:shadow-none"
            >
              <Icon name="play" fill className="h-[22px] w-[22px]" />
            </button>
          )}
        </div>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
          {lesson.pro && (
            <Badge variant="pro">
              <Icon name="crown" />
              PRO
            </Badge>
          )}
          <span className={meta}>
            {isYouTube ? <YouTubeLogo /> : <Icon name="audio-lines" />}
            {isYouTube ? "YouTube" : "Audio"}
          </span>
          <span className={meta}>
            <Icon name="clock" />
            {formatDuration(lesson.durationSec || 0)}
          </span>
          <span className={meta}>
            <Icon name="list-ordered" />
            {t("student.lessonDetail.sentencesCount", { count: lesson.sentenceCount, defaultValue: `${lesson.sentenceCount} câu` })}
          </span>
          <span className={meta}>
            <Icon name="headphones" />
            {t("student.lessonDetail.viewsCount", {
              count: formatCount(lesson.viewCount || 0, locale),
              defaultValue: `${formatCount(lesson.viewCount || 0, locale)} lượt học`,
            })}
          </span>
        </div>
        <h1 className="mt-2 font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{lesson.title}</h1>
        {lesson.titleVi && <p className="text-text-muted">{lesson.titleVi}</p>}
        {lesson.description && <p className="mt-2 text-sm leading-relaxed text-text-muted">{lesson.description}</p>}
        <LoopiSay mood={mood} text={say} className="mt-4" />
      </div>
    </section>
  );
}
