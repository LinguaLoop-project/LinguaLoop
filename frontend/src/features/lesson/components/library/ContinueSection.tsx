import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import type { LessonSummary } from "../../types";
import SectionHeading from "../SectionHeading";

const MAX_ITEMS = 3;

/** Chế độ đang làm dở: lấy chế độ có tiến độ cao hơn. */
function activeMode(l: LessonSummary): { mode: "dictation" | "shadowing"; percent: number } {
  const { dictationPercent, shadowingPercent } = l.progress;
  return shadowingPercent > dictationPercent
    ? { mode: "shadowing", percent: shadowingPercent }
    : { mode: "dictation", percent: dictationPercent };
}

/** "Tiếp tục học": các bài đang học dở, bấm nút phát để vào lại đúng chế độ. */
export default function ContinueSection({ lessons }: { lessons: LessonSummary[] }) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  if (lessons.length === 0) return null;

  return (
    <div className="mb-8">
      <SectionHeading icon="circle-play" title={t("student.lessons.continue.title", "Tiếp tục học")} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lessons.slice(0, MAX_ITEMS).map((l) => {
          const { mode, percent } = activeMode(l);
          const total = l.sentenceCount || 0;
          const current = Math.round((total * percent) / 100);
          const modeLabel = mode === "dictation" ? t("student.lessons.card.dictation", "Nghe chép") : t("student.lessons.card.shadowing", "Shadowing");
          return (
            <article
              key={l.id}
              className="grid cursor-pointer grid-cols-[88px_1fr_auto] items-center gap-3.5 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-card)] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong sm:p-3.5"
              onClick={() => navigate(`/student/lessons/${l.slug}`)}
            >
              <div className="grid h-14 w-[88px] place-items-center overflow-hidden rounded-sm border border-border bg-primary-soft">
                <Icon name={mode === "dictation" ? "headphones" : "mic"} className="text-2xl text-primary-text" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <b className="truncate font-body text-base font-semibold leading-tight text-text">{l.title}</b>
                <span className="truncate text-sm text-text-muted">
                  {modeLabel} · {t("student.lessons.continue.sentenceOf", { current, total, defaultValue: `câu ${current}/${total}` })}
                </span>
                <ProgressBar value={percent} tone={mode} label={`${modeLabel} ${Math.round(percent)}%`} className="mt-0.5" />
              </div>
              <button
                type="button"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-border bg-primary-soft text-primary-text transition-colors duration-150 hover:bg-primary hover:text-white"
                aria-label={t("student.lessons.continue.resume", { title: l.title, defaultValue: `Tiếp tục ${l.title}` })}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/student/lessons/${l.slug}?mode=${mode}`);
                }}
              >
                <Icon name="play" fill className="ml-0.5" />
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
