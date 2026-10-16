import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { formatCount } from "@/lib/format";
import type { LessonSummary } from "../types";
import LessonThumb from "./LessonThumb";
import ModeButton, { type PracticeMode } from "./ModeButton";

interface LessonCardProps {
  lesson: LessonSummary;
  /** Khi thư viện đang lọc theo một chế độ: chỉ hiện nút của chế độ đó. */
  mode?: PracticeMode | "all";
}

/** Thẻ bài học (`.card.hover.l-card` trong mockup v2, DESIGN.v2 §7.2). */
export const LessonCard = ({ lesson, mode = "all" }: LessonCardProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("pages");
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const open = (suffix = "") => navigate(`/student/lessons/${lesson.slug}${suffix}`);
  const modeLabel = (m: PracticeMode) => t(`student.lessons.card.${m}`, m === "dictation" ? "Nghe chép" : "Shadowing");

  const start = (m: PracticeMode) => {
    if (lesson.locked) {
      toast(t("student.lessons.lockedToast", "Bài này dành cho gói Pro"), {
        icon: "crown",
        action: { label: t("student.lessons.tryPro", "Dùng thử Pro"), onClick: () => navigate("/pricing") },
      });
      return;
    }
    open(`?mode=${m}`);
  };

  const modes: PracticeMode[] = mode === "all" ? ["dictation", "shadowing"] : [mode];

  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong"
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
      <LessonThumb lesson={lesson} />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-lg font-bold leading-[1.35]">{lesson.title}</h3>
        <div className="text-[13px] leading-normal text-text-muted">
          {i18n.language === "vi" && lesson.titleVi
            ? lesson.titleVi
            : t("student.lessons.card.sentences", { count: lesson.sentenceCount, defaultValue: `${lesson.sentenceCount} câu` })}
        </div>
        <span className="mt-1 flex items-center gap-2 text-[13px] text-text-subtle">
          <Icon name="headphones" />
          {t("student.lessons.card.viewsCount", {
            count: formatCount(lesson.viewCount || 0, locale),
            defaultValue: `${formatCount(lesson.viewCount || 0, locale)} lượt học`,
          })}
        </span>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {modes.map((m) => {
            const percent = m === "dictation" ? lesson.progress.dictationPercent : lesson.progress.shadowingPercent;
            return (
              <ModeButton
                key={m}
                mode={m}
                label={modeLabel(m)}
                ariaLabel={`${modeLabel(m)}: ${lesson.title}${percent > 0 ? `, ${percent}%` : ""}${lesson.locked ? ", Pro" : ""}`}
                title={percent > 0 ? t("student.lessons.card.done", { percent, defaultValue: `Đã làm ${percent}%` }) : t("student.lessons.card.notStarted", "Chưa học")}
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
    <div className="skeleton h-28 bg-surface-hover" />
    <div className="flex flex-col gap-2 p-4">
      <div className="skeleton h-[18px] w-[85%] rounded-sm bg-surface-hover" />
      <div className="skeleton h-3.5 w-[55%] rounded-sm bg-surface-hover" />
      <div className="skeleton h-3 w-2/5 rounded-sm bg-surface-hover" />
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="skeleton h-10 rounded-md bg-surface-hover" />
        <div className="skeleton h-10 rounded-md bg-surface-hover" />
      </div>
    </div>
  </div>
);
