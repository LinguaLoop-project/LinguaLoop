import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import type { PracticeMode } from "../ModeButton";

/** Màu chức năng của từng chế độ; class viết nguyên văn để Tailwind nhận ra. */
const STYLE: Record<PracticeMode, { icon: string; tile: string; ring: string }> = {
  dictation: { icon: "headphones", tile: "bg-fn-dictation-soft text-fn-dictation", ring: "hover:border-fn-dictation focus-visible:ring-fn-dictation" },
  shadowing: { icon: "mic", tile: "bg-fn-shadowing-soft text-fn-shadowing", ring: "hover:border-fn-shadowing focus-visible:ring-fn-shadowing" },
};

export interface PracticeModeCardProps {
  mode: PracticeMode;
  slug: string;
  sentenceCount: number;
  /** 0–100 */
  percent: number;
}

/** Thẻ chọn một chế độ luyện của bài, kèm tiến độ riêng và nút Bắt đầu. */
export default function PracticeModeCard({ mode, slug, sentenceCount, percent }: PracticeModeCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  const style = STYLE[mode];
  const p = `student.lessonDetail.${mode}`;
  const title = t(`${p}.title`, mode === "dictation" ? "Nghe chép" : "Shadowing");
  const go = () => navigate(`/student/${mode}/${slug}`);
  const done = Math.round((sentenceCount * percent) / 100);

  return (
    <div
      className={`flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 ${style.ring}`}
      tabIndex={0}
      role="button"
      aria-label={title}
      onClick={go}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          go();
        }
      }}
    >
      <div className={`grid h-12 w-12 place-items-center rounded-md border border-border text-[26px] ${style.tile}`}>
        <Icon name={style.icon} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        <p className="mt-0.5 text-xs text-text-muted">
          {t(
            `${p}.desc`,
            mode === "dictation"
              ? "Nghe từng câu rồi gõ lại. Chấm từng từ, gắn nhãn loại lỗi."
              : "Nghe mẫu rồi đọc theo. AI chấm phát âm tới từng âm vị.",
          )}
        </p>
      </div>
      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            {done}/{sentenceCount} {t("student.lessonDetail.sentenceUnit", "câu")}
          </span>
          <span>{percent > 0 ? `${Math.round(percent)}%` : t(`${p}.notStarted`, "Chưa bắt đầu")}</span>
        </div>
        <ProgressBar value={percent} tone={mode} label={`${title} ${Math.round(percent)}%`} className="mt-1.5 h-1" />
      </div>
      <Button
        variant="fn"
        fn={mode}
        onClick={(e) => {
          e.stopPropagation();
          go();
        }}
        rightIcon={<Icon name="arrow-right" />}
      >
        {t(`${p}.start`, "Bắt đầu")}
      </Button>
    </div>
  );
}
