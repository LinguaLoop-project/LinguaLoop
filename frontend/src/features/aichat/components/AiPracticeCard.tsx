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
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] md:col-span-2 md:flex-row md:items-center">
      <div className="grid size-12 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-text">
        <Icon name="bot" className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold leading-[1.4]">{t("card.title")}</h3>
        <p className="text-[13px] leading-normal text-text-muted">{t("card.desc")}</p>
        <p className="mt-1 text-xs text-text-subtle">{t("card.meta")}</p>
      </div>
      <Button onClick={go} leftIcon={locked ? <Icon name="crown" /> : <Icon name="messages-square" />}>
        {locked ? t("card.openWithPro") : t("card.start")}
      </Button>
    </div>
  );
}
