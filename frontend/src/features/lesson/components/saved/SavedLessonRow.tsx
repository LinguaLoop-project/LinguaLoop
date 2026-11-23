import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { formatDuration } from "@/lib/format";
import type { SavedLesson, StudyMode } from "../../savedLessons";
import { lessonStateOf, nextMode, savedAgo } from "../../savedUtils";

export interface SavedLessonRowProps {
  lesson: SavedLesson;
  now: Date;
  /** Đang bỏ lưu bài này: khóa nút để không bấm hai lần. */
  busy: boolean;
  onUnsave: (lesson: SavedLesson) => void;
}

const MODE_TONE: Record<StudyMode, { rail: string; dot: string }> = {
  dictation: { rail: "bg-fn-dictation", dot: "bg-fn-dictation" },
  shadowing: { rail: "bg-fn-shadowing", dot: "bg-fn-shadowing" },
};

const STATE_BADGE: Record<"todo" | "doing" | "done", string> = {
  todo: "border-border bg-bg-elevated text-text-muted",
  doing: "border-primary/40 bg-primary-soft text-primary-text",
  done: "border-success/40 bg-success-soft text-success",
};

/**
 * Một bài trong Bài đã lưu (chế độ danh sách). Ảnh bìa mang hai dải tiến độ như thanh tua của video
 * (xanh là nghe chép, hồng là shadowing); nút luyện được gợi ý tô màu chức năng, nút còn lại và bỏ lưu xếp gọn.
 */
export default function SavedLessonRow({ lesson, now, busy, onUnsave }: Readonly<SavedLessonRowProps>) {
  const { t, i18n } = useTranslation("saved");
  const navigate = useNavigate();
  const [thumbFailed, setThumbFailed] = useState(false);
  const locale = i18n.language === "vi" ? "vi" : "en";
  const open = lesson.availability === "available";
  const next = nextMode(lesson.progress);
  const other: StudyMode = next === "dictation" ? "shadowing" : "dictation";
  const percent = { dictation: lesson.progress.dictationPercent, shadowing: lesson.progress.shadowingPercent };
  const state = lessonStateOf(lesson.progress);
  const detailPath = `/student/lessons/${lesson.id}`;

  return (
    <article
      aria-label={t("row.aria", { title: lesson.title })}
      className={`grid items-center gap-4 p-4 transition-colors duration-150 sm:grid-cols-[minmax(0,224px)_minmax(0,1fr)] md:grid-cols-[minmax(0,224px)_minmax(0,1fr)_auto] md:gap-5 ${
        open ? "hover:bg-surface-hover/50" : "opacity-75"
      }`}
    >
      <div className="group/poster relative aspect-video overflow-hidden rounded-md bg-[linear-gradient(135deg,var(--primary-soft),transparent)]">
        {!thumbFailed && (
          <img
            src={`https://i.ytimg.com/vi/${lesson.youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover ${open ? "" : "grayscale"}`}
          />
        )}
        {thumbFailed && <Icon name="clapperboard" className="absolute inset-0 m-auto size-9 text-primary-text" />}
        {open && (
          <button
            type="button"
            aria-label={t("row.watch")}
            onClick={() => navigate(`/watch?start=${lesson.id}`)}
            className="absolute inset-0 grid cursor-pointer place-items-center bg-black/0 transition-colors duration-200 hover:bg-black/35 focus-visible:bg-black/35 focus-visible:outline-none [&>span]:scale-90 [&>span]:opacity-0 hover:[&>span]:scale-100 hover:[&>span]:opacity-100 focus-visible:[&>span]:scale-100 focus-visible:[&>span]:opacity-100"
          >
            <span className="grid size-11 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-[transform,opacity] duration-200">
              <Icon name="play" fill className="ml-0.5 size-5" />
            </span>
          </button>
        )}
        {lesson.durationSec != null && (
          <span
            className="absolute bottom-2.5 right-2 rounded-sm bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white"
            title={t("row.duration", { time: formatDuration(lesson.durationSec) })}
          >
            {formatDuration(lesson.durationSec)}
          </span>
        )}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex flex-col gap-px bg-black/55">
          {(["dictation", "shadowing"] as const).map((mode) => (
            <span key={mode} className="block h-[3px] w-full bg-white/15">
              <span className={`block h-full ${MODE_TONE[mode].rail}`} style={{ width: `${percent[mode]}%` }} />
            </span>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-text-muted">
          {lesson.cefrLevel && <Badge variant={lesson.cefrLevel}>{lesson.cefrLevel}</Badge>}
          {lesson.pro && (
            <Badge variant="pro">
              <Icon name="crown" />
              PRO
            </Badge>
          )}
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATE_BADGE[state]}`}>
            {t(`states.${state}`)}
          </span>
          {lesson.topicName && <span className="truncate">{lesson.topicName}</span>}
          <span>{t("row.sentences", { count: lesson.sentenceCount })}</span>
        </div>
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-[1.3] tracking-[-0.01em]">
          {open ? (
            <button
              type="button"
              onClick={() => navigate(detailPath)}
              className="cursor-pointer text-left transition-colors hover:text-primary-text focus-visible:text-primary-text focus-visible:outline-none"
            >
              {lesson.title}
            </button>
          ) : (
            lesson.title
          )}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-text-muted">
          {(["dictation", "shadowing"] as const).map((mode) => (
            <div key={mode} className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-2 rounded-full ${MODE_TONE[mode].dot}`} />
              <span className="tabular-nums">{t(`row.${mode}`, { percent: percent[mode] })}</span>
              <span aria-hidden="true" className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-bg-elevated sm:inline-block">
                <span className={`block h-full ${MODE_TONE[mode].rail}`} style={{ width: `${percent[mode]}%` }} />
              </span>
            </div>
          ))}
          <span className="text-text-subtle">{t("row.savedAgo", { when: savedAgo(lesson.savedAt, now, locale) })}</span>
        </div>
        {lesson.availability !== "available" && (
          <p className="flex items-start gap-2 rounded-md bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-3 py-2 text-[13px] text-text">
            <Icon name={lesson.availability === "pro_required" ? "lock" : "triangle-alert"} className="mt-0.5 size-4 shrink-0 text-warning" />
            {lesson.availability === "pro_required" ? t("row.proRequired") : t("row.unavailable")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2 md:col-span-1 md:w-52 md:flex-col md:items-stretch">
        {open && (
          <Button
            variant="fn"
            fn={next}
            size="sm"
            leftIcon={<Icon name={next === "dictation" ? "headphones" : "mic"} />}
            onClick={() => navigate(`/student/${next}/${lesson.id}`)}
          >
            {t(`row.practice.${next}`)}
          </Button>
        )}
        {lesson.availability === "pro_required" && (
          <Button size="sm" leftIcon={<Icon name="crown" />} onClick={() => navigate("/pricing")}>
            {t("row.tryPro")}
          </Button>
        )}
        <div className="flex items-center gap-2">
          {open && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              leftIcon={<Icon name={other === "dictation" ? "headphones" : "mic"} />}
              onClick={() => navigate(`/student/${other}/${lesson.id}`)}
            >
              {t(`row.alsoPractice.${other}`)}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            iconOnly={open}
            disabled={busy}
            leftIcon={!open ? <Icon name="bookmark" fill /> : undefined}
            aria-label={`${t("row.unsave")}: ${lesson.title}`}
            title={t("row.unsave")}
            onClick={() => onUnsave(lesson)}
            className="text-primary-text"
          >
            {open ? <Icon name="bookmark" fill /> : t("row.unsave")}
          </Button>
        </div>
      </div>
    </article>
  );
}
