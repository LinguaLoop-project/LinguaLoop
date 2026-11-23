import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { formatDuration } from "@/lib/format";
import type { SavedLesson } from "../../savedLessons";
import { lessonStateOf, savedAgo } from "../../savedUtils";
import ModeButton, { type PracticeMode } from "../ModeButton";
import ModeRails from "../ModeRails";

export interface SavedLessonCardProps {
  lesson: SavedLesson;
  now: Date;
  busy: boolean;
  onUnsave: (lesson: SavedLesson) => void;
}

const STATE_BADGE: Record<"todo" | "doing" | "done", string> = {
  todo: "border-border bg-bg-elevated text-text-muted",
  doing: "border-primary/40 bg-primary-soft text-primary-text",
  done: "border-success/40 bg-success-soft text-success",
};

/** Thẻ bài đã lưu ở chế độ lưới: ảnh bìa 16:9, thanh tiến độ đôi, nhãn trạng thái và hai nút luyện tập. */
export default function SavedLessonCard({ lesson, now, busy, onUnsave }: Readonly<SavedLessonCardProps>) {
  const { t, i18n } = useTranslation("saved");
  const navigate = useNavigate();
  const [thumbFailed, setThumbFailed] = useState(false);
  const locale = i18n.language === "vi" ? "vi" : "en";
  const open = lesson.availability === "available";
  const detailPath = `/student/lessons/${lesson.id}`;
  const state = lessonStateOf(lesson.progress);
  const modes: PracticeMode[] = ["dictation", "shadowing"];

  return (
    <article
      aria-label={t("row.aria", { title: lesson.title })}
      tabIndex={open ? 0 : undefined}
      onClick={() => {
        if (open) navigate(detailPath);
      }}
      onKeyDown={(e) => {
        if (open && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          navigate(detailPath);
        }
      }}
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:z-20 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] before:opacity-0 before:transition-opacity before:duration-300 ${
        open
          ? "cursor-pointer hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--primary)_70%,var(--border))] hover:shadow-[0_22px_48px_-14px_rgba(0,0,0,0.55),0_0_32px_color-mix(in_srgb,var(--primary)_42%,transparent),0_0_72px_color-mix(in_srgb,var(--primary)_22%,transparent)] hover:before:opacity-100 focus-visible:outline-2 focus-visible:outline-primary"
          : "opacity-75"
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-[linear-gradient(135deg,var(--primary-soft),transparent)]">
        {!thumbFailed && (
          <img
            src={`https://i.ytimg.com/vi/${lesson.youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              open ? "group-hover:scale-[1.07]" : "grayscale"
            }`}
          />
        )}
        {thumbFailed && <Icon name="clapperboard" className="absolute inset-0 m-auto size-10 text-primary-text" />}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_30%,rgba(255,255,255,0.16)_50%,transparent_70%)] transition-transform duration-700 ease-out group-hover:translate-x-full"
        />

        {open && (
          <button
            type="button"
            aria-label={t("row.watch")}
            title={t("row.watch")}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/watch?start=${lesson.id}`);
            }}
            className="absolute inset-0 grid cursor-pointer place-items-center bg-black/0 transition-colors duration-200 hover:bg-black/35 focus-visible:bg-black/35 focus-visible:outline-none [&>span]:scale-90 [&>span]:opacity-0 hover:[&>span]:scale-100 hover:[&>span]:opacity-100 focus-visible:[&>span]:scale-100 focus-visible:[&>span]:opacity-100"
          >
            <span className="grid size-12 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-[transform,opacity] duration-200">
              <Icon name="play" fill className="ml-0.5 size-5" />
            </span>
          </button>
        )}

        <span className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5">
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

        <button
          type="button"
          disabled={busy}
          aria-label={`${t("row.unsave")}: ${lesson.title}`}
          title={t("row.unsave")}
          onClick={(e) => {
            e.stopPropagation();
            onUnsave(lesson);
          }}
          className="absolute right-2.5 top-2.5 z-10 grid size-8 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/60 text-primary-text backdrop-blur-sm transition-colors hover:bg-black/85 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="bookmark" fill className="size-4" />
        </button>

        {lesson.durationSec != null && (
          <span
            className="pointer-events-none absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-sm bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white"
            title={t("row.duration", { time: formatDuration(lesson.durationSec) })}
          >
            <Icon name="clock" className="size-3" />
            {formatDuration(lesson.durationSec)}
          </span>
        )}

        <ModeRails progress={lesson.progress} className="bg-black/55" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
          <span className="truncate">{lesson.topicName || t("row.sentences", { count: lesson.sentenceCount })}</span>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATE_BADGE[state]}`}>
            {t(`states.${state}`)}
          </span>
        </div>

        <h3 className="line-clamp-2 font-display text-base font-bold leading-[1.35] tracking-[-0.01em] transition-colors group-hover:text-primary-text">
          {lesson.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-text-subtle">
          <span>{t("row.sentences", { count: lesson.sentenceCount })}</span>
          <span aria-hidden="true">·</span>
          <span>{t("row.savedAgo", { when: savedAgo(lesson.savedAt, now, locale) })}</span>
        </div>

        {lesson.availability !== "available" ? (
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <p className="flex items-start gap-2 rounded-md bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-3 py-2 text-xs text-text">
              <Icon
                name={lesson.availability === "pro_required" ? "lock" : "triangle-alert"}
                className="mt-0.5 size-4 shrink-0 text-warning"
              />
              {lesson.availability === "pro_required" ? t("row.proRequired") : t("row.unavailable")}
            </p>
            {lesson.availability === "pro_required" && (
              <Button
                size="sm"
                leftIcon={<Icon name="crown" />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/pricing");
                }}
              >
                {t("row.tryPro")}
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
            {modes.map((m) => {
              const percent = m === "dictation" ? lesson.progress.dictationPercent : lesson.progress.shadowingPercent;
              const label = t(`row.${m}Short`);
              return (
                <ModeButton
                  key={m}
                  mode={m}
                  label={label}
                  ariaLabel={`${label}: ${lesson.title}${percent > 0 ? `, ${percent}%` : ""}`}
                  title={t(`row.${m}`, { percent })}
                  percent={percent}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/student/${m}/${lesson.id}`);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
