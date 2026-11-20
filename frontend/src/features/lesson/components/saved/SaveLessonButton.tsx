import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { useToggleLessonSaved } from "../../hooks/useSavedLessons";

export interface SaveLessonButtonProps {
  lessonId: string;
  saved: boolean;
  /** Bài Pro mà học viên chưa có Pro: không lưu được (BR-TC-19). */
  locked: boolean;
}

/** Nút "Lưu bài" ở đầu trang chi tiết bài học: dấu trang rỗng khi chưa lưu, đầy khi đã lưu (UC-TC-05). */
export default function SaveLessonButton({ lessonId, saved, locked }: Readonly<SaveLessonButtonProps>) {
  const { t } = useTranslation("saved");
  const navigate = useNavigate();
  const toggle = useToggleLessonSaved();

  const needPro = () =>
    toast(t("button.needPro"), {
      icon: "crown",
      action: { label: t("button.tryPro"), onClick: () => navigate("/pricing") },
    });

  const onClick = () => {
    if (!saved && locked) {
      needPro();
      return;
    }
    toggle.mutate(
      { lessonId, saved: !saved },
      {
        onSuccess: (_data, vars) => {
          if (vars.saved) {
            toast(t("button.savedToast"), {
              icon: "bookmark-check",
              action: { label: t("button.view"), onClick: () => navigate("/student/saved-lessons") },
            });
          }
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.data?.code === "LESSON_PRO_REQUIRED") needPro();
          else toast(t("toast.failed"), { icon: "circle-alert" });
        },
      },
    );
  };

  return (
    <Button
      variant={saved ? "secondary" : "ghost"}
      size="sm"
      aria-pressed={saved}
      aria-label={saved ? t("button.unsaveAria") : t("button.saveAria")}
      disabled={toggle.isPending}
      leftIcon={<Icon name="bookmark" fill={saved} className={saved ? "text-primary-text" : ""} />}
      onClick={onClick}
    >
      {saved ? t("button.saved") : t("button.save")}
    </Button>
  );
}
