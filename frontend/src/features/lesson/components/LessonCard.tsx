import { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { formatCount } from "@/lib/format";
import { useToggleLessonSaved } from "../hooks/useSavedLessons";
import type { LessonSummary } from "../types";
import LessonThumb from "./LessonThumb";
import ModeButton, { type PracticeMode } from "./ModeButton";

interface LessonCardProps {
  lesson: LessonSummary;
  /** Khi thư viện đang lọc theo một chế độ: chỉ hiện nút của chế độ đó. */
  mode?: PracticeMode | "all";
}

const CARD_HOVER: Record<PracticeMode | "all", { card: string; title: string }> = {
  all: {
    card: "hover:border-[color-mix(in_srgb,var(--primary)_70%,var(--border))] hover:shadow-[0_22px_48px_-14px_rgba(0,0,0,0.55),0_0_32px_color-mix(in_srgb,var(--primary)_42%,transparent),0_0_72px_color-mix(in_srgb,var(--primary)_22%,transparent)]",
    title: "group-hover:text-primary-text",
  },
  dictation: {
    card: "hover:border-[color-mix(in_srgb,var(--fn-dictation)_70%,var(--border))] hover:shadow-[0_22px_48px_-14px_rgba(0,0,0,0.55),0_0_32px_color-mix(in_srgb,var(--fn-dictation)_42%,transparent),0_0_72px_color-mix(in_srgb,var(--fn-dictation)_22%,transparent)]",
    title: "group-hover:text-fn-dictation",
  },
  shadowing: {
    card: "hover:border-[color-mix(in_srgb,var(--fn-shadowing)_70%,var(--border))] hover:shadow-[0_22px_48px_-14px_rgba(0,0,0,0.55),0_0_32px_color-mix(in_srgb,var(--fn-shadowing)_42%,transparent),0_0_72px_color-mix(in_srgb,var(--fn-shadowing)_22%,transparent)]",
    title: "group-hover:text-fn-shadowing",
  },
};

/** Thẻ bài học (`.card.hover.l-card` trong mockup v2, DESIGN.v2 §7.2). */
export const LessonCard = ({ lesson, mode = "all" }: LessonCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["pages", "saved"]);
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const toggleSaved = useToggleLessonSaved();
  const [saved, setSaved] = useState(Boolean(lesson.saved));
  const [seenSaved, setSeenSaved] = useState(Boolean(lesson.saved));
  // Cờ lưu từ máy chủ đổi (tải lại danh sách): lấy theo, đặt ngay khi render thay vì qua effect.
  if (Boolean(lesson.saved) !== seenSaved) {
    setSeenSaved(Boolean(lesson.saved));
    setSaved(Boolean(lesson.saved));
  }

  const open = (suffix = "") => navigate(`/student/lessons/${lesson.id}${suffix}`);
  const modeLabel = (m: PracticeMode) => t(`pages:student.lessons.card.${m}`, m === "dictation" ? "Nghe chép" : "Shadowing");

  const needPro = () =>
    toast(t("pages:student.lessons.lockedToast", "Bài này dành cho gói Pro"), {
      icon: "crown",
      action: { label: t("pages:student.lessons.tryPro", "Dùng thử Pro"), onClick: () => navigate("/pricing") },
    });

  const start = (m: PracticeMode) => {
    if (lesson.locked) {
      needPro();
      return;
    }
    navigate(`/student/${m}/${lesson.id}`);
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!saved && lesson.locked) {
      needPro();
      return;
    }
    const next = !saved;
    setSaved(next);
    toggleSaved.mutate(
      { lessonId: lesson.id, saved: next },
      {
        onSuccess: () => {
          if (next) {
            toast(t("saved:button.savedToast"), {
              icon: "bookmark-check",
              action: { label: t("saved:button.view"), onClick: () => navigate("/student/saved-lessons") },
            });
          } else {
            toast(t("saved:toast.unsaved"), { icon: "bookmark" });
          }
        },
        onError: (error) => {
          setSaved(!next);
          if (isAxiosError(error) && error.response?.data?.code === "LESSON_PRO_REQUIRED") needPro();
          else toast(t("saved:toast.failed"), { icon: "circle-alert" });
        },
      },
    );
  };

  const modes: PracticeMode[] = mode === "all" ? ["dictation", "shadowing"] : [mode];
  const hoverStyle = CARD_HOVER[mode];

  return (
    <article
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:z-20 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] before:opacity-0 before:transition-opacity before:duration-300 hover:-translate-y-1.5 hover:before:opacity-100 focus-visible:outline-2 focus-visible:outline-primary ${hoverStyle.card}`}
      data-lesson={lesson.id}
      tabIndex={0}
      aria-label={t("pages:student.lessons.card.aria", { title: lesson.title, defaultValue: `Bài ${lesson.title}` })}
      onClick={() => open()}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          open();
        }
      }}
    >
      <LessonThumb
        lesson={lesson}
        playOverlay
        topRight={
          <button
            type="button"
            disabled={toggleSaved.isPending}
            aria-pressed={saved}
            aria-label={saved ? t("saved:button.unsaveAria") : t("saved:button.saveAria")}
            title={saved ? t("saved:button.saved") : t("saved:button.save")}
            onClick={handleToggleSave}
            className={`grid size-8 cursor-pointer place-items-center rounded-full border backdrop-blur-sm transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 ${
              saved
                ? "border-primary/50 bg-black/75 text-primary-text hover:bg-black/90"
                : "border-white/15 bg-black/55 text-white/85 hover:bg-black/80 hover:text-white"
            }`}
          >
            <Icon name="bookmark" fill={saved} className="size-4" />
          </button>
        }
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className={`line-clamp-2 text-lg font-bold leading-[1.35] transition-colors duration-200 ${hoverStyle.title}`}>{lesson.title}</h3>
        <div className="text-[13px] leading-normal text-text-muted">
          {t("pages:student.lessons.card.sentences", { count: lesson.sentenceCount, defaultValue: `${lesson.sentenceCount} câu` })}
        </div>
        <span className="mt-1 flex items-center gap-2 text-[13px] text-text-subtle">
          <Icon name="headphones" />
          {t("pages:student.lessons.card.viewsCount", {
            count: formatCount(lesson.viewCount || 0, locale),
            defaultValue: `${formatCount(lesson.viewCount || 0, locale)} lượt học`,
          })}
        </span>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          {modes.map((m) => {
            const percent = m === "dictation" ? lesson.progress.dictationPercent : lesson.progress.shadowingPercent;
            return (
              <ModeButton
                key={m}
                mode={m}
                label={modeLabel(m)}
                ariaLabel={`${modeLabel(m)}: ${lesson.title}${percent > 0 ? `, ${percent}%` : ""}${lesson.locked ? ", Pro" : ""}`}
                title={percent > 0 ? t("pages:student.lessons.card.done", { percent, defaultValue: `Đã làm ${percent}%` }) : t("pages:student.lessons.card.notStarted", "Chưa học")}
                percent={percent}
                locked={lesson.locked}
                single={mode !== "all"}
                onClick={(e) => {
                  e.stopPropagation();
                  start(m);
                }}
              />
            );
          })}
        </div>
      </div>
    </article>
  );
};

/** Khung chờ cùng hình dạng thẻ bài (`.skel-card`) để trang không nhảy bố cục khi dữ liệu về. */
export const LessonCardSkeleton = () => (
  <div aria-hidden="true" className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
    <div className="skeleton aspect-video bg-surface-hover" />
    <div className="flex flex-col gap-2 p-4">
      <div className="skeleton h-[18px] w-[85%] rounded-sm bg-surface-hover" />
      <div className="skeleton h-3.5 w-[55%] rounded-sm bg-surface-hover" />
      <div className="skeleton h-3 w-2/5 rounded-sm bg-surface-hover" />
      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
        <div className="skeleton h-10 rounded-md bg-surface-hover" />
        <div className="skeleton h-10 rounded-md bg-surface-hover" />
      </div>
    </div>
  </div>
);
