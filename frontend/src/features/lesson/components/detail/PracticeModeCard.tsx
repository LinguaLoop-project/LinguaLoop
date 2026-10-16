import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import { toast } from "@/stores/toastStore";
import type { PracticeMode } from "../ModeButton";

/** Màu chức năng của từng chế độ; class viết nguyên văn để Tailwind nhận ra. */
const STYLE: Record<PracticeMode, { icon: string; rec: string; title: string; tile: string }> = {
  dictation: { icon: "headphones", rec: "border-fn-dictation bg-fn-dictation-soft shadow-[0_0_0_1px_var(--fn-dictation),var(--shadow-card)]", title: "text-fn-dictation", tile: "text-fn-dictation" },
  shadowing: { icon: "mic", rec: "border-fn-shadowing bg-fn-shadowing-soft shadow-[0_0_0_1px_var(--fn-shadowing),var(--shadow-card)]", title: "text-fn-shadowing", tile: "text-fn-shadowing" },
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
      className={`flex cursor-pointer flex-col gap-3.5 rounded-lg border p-5 shadow-[var(--shadow-card)] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 ${
        recommended ? style.rec : "border-border bg-surface hover:border-border-strong"
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
        <div className={`grid h-12 w-12 place-items-center rounded-md bg-surface ${style.tile}`}>
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
        <h3 className={`text-lg font-bold leading-[1.4] ${recommended ? style.title : ""}`}>{title}</h3>
        <p className="text-[13px] leading-normal text-text-muted">
          {t(
            `${p}.desc`,
            mode === "dictation" ? "Nghe từng câu rồi gõ lại. Chấm từng từ, gắn nhãn loại lỗi." : "Nghe mẫu rồi đọc theo. AI chấm phát âm tới từng âm vị.",
          )}
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between text-[13px] text-text-muted">
          <span>
            {done}/{sentenceCount} {t("student.lessonDetail.sentenceUnit", "câu")}
          </span>
          <span>{started ? `${Math.round(percent)}%` : t(`${p}.notStarted`, "Chưa bắt đầu")}</span>
        </div>
        <ProgressBar value={percent} tone={mode} thin label={`${title} ${Math.round(percent)}%`} className="mt-2" />
      </div>
      <Button
        variant={recommended || locked ? "fn" : "ghost"}
        fn={mode}
        onClick={(e) => {
          e.stopPropagation();
          go();
        }}
      >
        {locked && <Icon name="crown" />}
        {cta}
        {!locked && <Icon name="arrow-right" />}
      </Button>
    </div>
  );
}
