import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";

export interface AiPracticeCardProps {
  lessonId: string;
  /** Bài Pro mà người dùng chưa có Pro (AC-AI-09). */
  locked: boolean;
}

/** Thẻ vào "Thực hành với AI" trên trang chi tiết bài, nằm dưới hai thẻ Nghe chép và Shadowing. */
export default function AiPracticeCard({ lessonId, locked }: Readonly<AiPracticeCardProps>) {
  const { t } = useTranslation("aichat");
  const navigate = useNavigate();

  const go = () => {
    if (locked) {
      toast(t("errors.LESSON_PRO_REQUIRED"), {
        icon: "crown",
        action: { label: t("upgrade"), onClick: () => navigate("/pricing") },
      });
      return;
    }
    navigate(`/student/lessons/${lessonId}/ai`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("card.title")}
      onClick={go}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          go();
        }
      }}
      className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--primary)_65%,var(--border))] hover:shadow-[0_20px_40px_-14px_rgba(0,0,0,0.5),0_0_24px_color-mix(in_srgb,var(--primary)_32%,transparent)] md:col-span-2 md:flex-row md:items-center"
    >
      <div className="grid size-12 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary-soft text-primary-text transition-transform duration-200 group-hover:scale-110">
        <Icon name="bot" className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold leading-[1.4] transition-colors group-hover:text-primary-text">
          {t("card.title")}
        </h3>
        <p className="text-[13px] leading-normal text-text-muted">{t("card.desc")}</p>
        <p className="mt-1 text-xs text-text-subtle">{t("card.meta")}</p>
      </div>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          go();
        }}
        leftIcon={locked ? <Icon name="crown" /> : <Icon name="messages-square" />}
        rightIcon={
          !locked ? (
            <Icon name="arrow-right" className="transition-transform duration-200 group-hover:translate-x-0.5" />
          ) : undefined
        }
        className="shrink-0 transition-shadow duration-200 group-hover:shadow-[0_8px_20px_-4px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
      >
        {locked ? t("card.openWithPro") : t("card.start")}
      </Button>
    </div>
  );
}
