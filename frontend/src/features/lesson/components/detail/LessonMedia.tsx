import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import type { LessonDetail } from "../../types";
import { resolveMedia } from "../../utils";

/** Khung phát: hiện ảnh bìa và nút phát, bấm thì thay bằng trình phát. */
export default function LessonMedia({ lesson }: { lesson: LessonDetail }) {
  const { t } = useTranslation(["pages", "common"]);
  const [playing, setPlaying] = useState(false);
  const { rawUrl, isYouTube, embedUrl } = resolveMedia(lesson);

  if (embedUrl && playing) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {isYouTube ? (
          <iframe
            src={embedUrl}
            title={lesson.title}
            className="h-full w-full rounded-[inherit] border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : lesson.sourceType?.toLowerCase() === "audio" ? (
          <div className="grid h-full w-full place-items-center rounded-[inherit] border border-border bg-surface-hover p-6">
            <audio src={rawUrl} controls autoPlay className="w-full max-w-md" />
          </div>
        ) : (
          <video src={rawUrl} controls autoPlay className="h-full w-full rounded-[inherit] border border-border object-cover" />
        )}
        <button
          type="button"
          className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-black/60 text-white transition-colors hover:bg-black/90"
          title={t("common:actions.close", "Đóng")}
          aria-label={t("common:actions.close", "Đóng")}
          onClick={() => setPlaying(false)}
        >
          <Icon name="x" className="text-base" />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative grid aspect-video place-items-center overflow-hidden rounded-xl border border-border bg-primary-soft">
      {lesson.thumbnailUrl ? (
        <img src={lesson.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <Icon name="headphones" className="text-[44px] text-primary-text" />
      )}
      <button
        type="button"
        className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-primary text-[28px] text-white transition-transform duration-200 hover:scale-105"
        aria-label={t("pages:student.lessonDetail.playVideo", "Phát video")}
        onClick={() => setPlaying(true)}
      >
        <Icon name="play" fill className="ml-1" />
      </button>
    </div>
  );
}
