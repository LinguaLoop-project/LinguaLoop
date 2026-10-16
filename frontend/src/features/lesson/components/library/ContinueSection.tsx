import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import type { LessonSummary } from "../../types";
import LessonThumb from "../LessonThumb";
import SectionHeading from "../SectionHeading";
import type { PracticeMode } from "../ModeButton";

const MAX_ITEMS = 3;

/** Chế độ đang làm dở: theo bộ lọc nếu có, không thì lấy chế độ có tiến độ cao hơn. */
function activeMode(l: LessonSummary, filter: PracticeMode | "all"): { mode: PracticeMode; percent: number } {
  const { dictationPercent, shadowingPercent } = l.progress;
  if (filter !== "all") return { mode: filter, percent: filter === "dictation" ? dictationPercent : shadowingPercent };
  return dictationPercent > 0 && dictationPercent < 100
    ? { mode: "dictation", percent: dictationPercent }
    : { mode: "shadowing", percent: shadowingPercent };
}

/** "Tiếp tục học" (`.ccard`): thẻ nhỏ có tiến độ "câu x/n" và nút phát mang màu chức năng của chế độ đang học. */
export default function ContinueSection({ lessons, mode: filter = "all" }: { lessons: LessonSummary[]; mode?: PracticeMode | "all" }) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  if (lessons.length === 0) return null;

  return (
    <>
      <SectionHeading icon="circle-play" title={t("student.lessons.continue.title", "Tiếp tục học")} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {lessons.slice(0, MAX_ITEMS).map((l) => {
          const { mode, percent } = activeMode(l, filter);
          const total = l.sentenceCount || 0;
          const current = Math.round((total * percent) / 100);
          const modeLabel = mode === "dictation" ? t("student.lessons.card.dictation", "Nghe chép") : t("student.lessons.card.shadowing", "Shadowing");
          return (
            <article
              key={l.id}
              tabIndex={0}
              aria-label={t("student.lessons.continue.resume", { title: l.title, defaultValue: `Tiếp tục ${l.title}` })}
              className="group grid cursor-pointer grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-lg border border-border bg-surface p-3 shadow-[var(--shadow-card)] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong"
              onClick={() => navigate(`/student/lessons/${l.slug}`)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && e.key === "Enter") navigate(`/student/lessons/${l.slug}`);
              }}
            >
              <LessonThumb lesson={l} corners={false} compact className="!h-[72px] rounded-md" />
              <div className="flex min-w-0 flex-col gap-1">
                <b className="font-bold leading-[1.35]">{l.title}</b>
                <span className="text-[13px] leading-normal text-text-muted">
                  {modeLabel} · {t("student.lessons.continue.sentenceOf", { current, total, defaultValue: `câu ${current}/${total}` })}
                </span>
                <ProgressBar value={percent} tone={mode} thin label={`${modeLabel} ${Math.round(percent)}%`} />
              </div>
              <Button
                variant="fn"
                fn={mode}
                iconOnly
                aria-label={t("student.lessons.continue.resume", { title: l.title, defaultValue: `Tiếp tục ${l.title}` })}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/student/lessons/${l.slug}?mode=${mode}`);
                }}
              >
                <Icon name="play" fill />
              </Button>
            </article>
          );
        })}
      </div>
    </>
  );
}
