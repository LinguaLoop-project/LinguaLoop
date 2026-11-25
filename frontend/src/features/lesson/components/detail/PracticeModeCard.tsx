import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import { toast } from "@/stores/toastStore";
import type { PracticeMode } from "../ModeButton";

/** Màu chức năng của từng chế độ; class viết nguyên văn để Tailwind nhận ra. */
const STYLE: Record<
  PracticeMode,
  { icon: string; rec: string; idle: string; title: string; tile: string; secondaryBtn: string }
> = {
  dictation: {
    icon: "headphones",
    rec: "border-fn-dictation bg-fn-dictation-soft shadow-[0_0_0_1px_var(--fn-dictation),var(--shadow-card)] hover:shadow-[0_20px_40px_-14px_rgba(0,0,0,0.55),0_0_28px_color-mix(in_srgb,var(--fn-dictation)_40%,transparent)]",
    idle: "border-border bg-surface hover:border-[color-mix(in_srgb,var(--fn-dictation)_65%,var(--border))] hover:shadow-[0_20px_40px_-14px_rgba(0,0,0,0.5),0_0_24px_color-mix(in_srgb,var(--fn-dictation)_32%,transparent)]",
    title: "text-fn-dictation",
    tile: "bg-fn-dictation-soft text-fn-dictation border border-fn-dictation/30",
    secondaryBtn:
      "border-fn-dictation/40 bg-fn-dictation-soft text-fn-dictation hover:border-fn-dictation hover:bg-fn-dictation hover:text-white hover:shadow-[0_8px_20px_-4px_color-mix(in_srgb,var(--fn-dictation)_55%,transparent)]",
  },
  shadowing: {
    icon: "mic",
    rec: "border-fn-shadowing bg-fn-shadowing-soft shadow-[0_0_0_1px_var(--fn-shadowing),var(--shadow-card)] hover:shadow-[0_20px_40px_-14px_rgba(0,0,0,0.55),0_0_28px_color-mix(in_srgb,var(--fn-shadowing)_40%,transparent)]",
    idle: "border-border bg-surface hover:border-[color-mix(in_srgb,var(--fn-shadowing)_65%,var(--border))] hover:shadow-[0_20px_40px_-14px_rgba(0,0,0,0.5),0_0_24px_color-mix(in_srgb,var(--fn-shadowing)_32%,transparent)]",
    title: "text-fn-shadowing",
    tile: "bg-fn-shadowing-soft text-fn-shadowing border border-fn-shadowing/30",
    secondaryBtn:
      "border-fn-shadowing/40 bg-fn-shadowing-soft text-fn-shadowing hover:border-fn-shadowing hover:bg-fn-shadowing hover:text-white hover:shadow-[0_8px_20px_-4px_color-mix(in_srgb,var(--fn-shadowing)_55%,transparent)]",
  },
};

export interface PracticeModeCardProps {
  mode: PracticeMode;
  slug: string;
  sentenceCount: number;
  /** 0–100; 0 là chưa học. */
  percent: number;
  /** Chế độ được gợi ý bắt đầu: nổi bật bằng viền và nền màu chức năng. */
  recommended: boolean;
  /** Bài Pro mà người dùng chưa có Pro. */
  locked: boolean;
}

/** Thẻ chọn một chế độ luyện (`.mode-card`): trạng thái, tiến độ riêng và nút Bắt đầu / Tiếp tục / Luyện lại. */
export default function PracticeModeCard({ mode, slug, sentenceCount, percent, recommended, locked }: PracticeModeCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  const style = STYLE[mode];
  const p = `student.lessonDetail.${mode}`;
  const title = t(`${p}.title`, mode === "dictation" ? "Nghe chép" : "Shadowing");
  const done = Math.round((sentenceCount * percent) / 100);
  const started = percent > 0;

  const go = () => {
    if (locked) {
      toast(t("student.lessons.lockedToast", "Bài này dành cho gói Pro"), {
        icon: "crown",
        action: { label: t("student.lessons.tryPro", "Dùng thử Pro"), onClick: () => navigate("/pricing") },
      });
      return;
    }
    navigate(`/student/${mode}/${slug}`);
  };

  const cta = locked
    ? t("student.lessonDetail.openWithPro", "Mở với Pro")
    : !started
      ? t(`${p}.start`, "Bắt đầu")
      : percent < 100
        ? t("student.lessonDetail.continueFrom", { n: done + 1, defaultValue: `Tiếp tục từ câu ${done + 1}` })
        : t("student.lessonDetail.again", "Luyện lại");

  return (
    <div
      className={`group relative flex cursor-pointer flex-col gap-3.5 overflow-hidden rounded-lg border p-5 shadow-[var(--shadow-card)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] hover:-translate-y-1 ${
        recommended ? style.rec : style.idle
      }`}
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
      <div className="flex items-center justify-between gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-md transition-transform duration-200 group-hover:scale-110 ${style.tile}`}>
          <Icon name={style.icon} className="h-6 w-6" />
        </div>
        {percent >= 100 ? (
          <Badge variant="success">
            <Icon name="check" />
            {t("student.lessonDetail.finished", "Đã xong")}
          </Badge>
        ) : started ? (
          <Badge variant="primary">{t("student.lessonDetail.inProgress", "Đang học")}</Badge>
        ) : recommended ? (
          <Badge variant="primary">
            <Icon name="sparkles" />
            {t("student.lessonDetail.recommended", "Gợi ý bắt đầu")}
          </Badge>
        ) : null}
      </div>
      <div>
        <h3 className={`text-lg font-bold leading-[1.4] ${style.title}`}>{title}</h3>
        <p className="text-[13px] leading-normal text-text-muted">
          {t(
            `${p}.desc`,
            mode === "dictation" ? "Nghe từng câu rồi gõ lại. Chấm từng từ, gắn nhãn loại lỗi." : "Nghe mẫu rồi đọc theo. AI chấm phát âm tới từng âm vị.",
          )}
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between text-[13px] text-text-muted">
          <span className="tabular-nums">
            {done}/{sentenceCount} {t("student.lessonDetail.sentenceUnit", "câu")}
          </span>
          <span className="font-semibold tabular-nums">{started ? `${Math.round(percent)}%` : t(`${p}.notStarted`, "Chưa bắt đầu")}</span>
        </div>
        <ProgressBar value={percent} tone={mode} thin label={`${title} ${Math.round(percent)}%`} className="mt-2" />
      </div>
      <Button
        variant={recommended || locked ? "fn" : "ghost"}
        fn={mode}
        className={!recommended && !locked ? style.secondaryBtn : ""}
        onClick={(e) => {
          e.stopPropagation();
          go();
        }}
      >
        {locked && <Icon name="crown" />}
        {cta}
        {!locked && <Icon name="arrow-right" className="transition-transform duration-200 group-hover:translate-x-0.5" />}
      </Button>
    </div>
  );
}
