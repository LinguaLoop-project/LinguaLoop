import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "@/stores/toastStore";
import type { CreateCallbacks } from "./createJobs";
import { errorMessage } from "./errors";
import { TEACHER_LESSONS_PATH } from "./paths";
import type { CreatedLesson } from "./types";

/** Báo kết quả của một lượt tạo bài; dùng được cả khi giáo viên đã rời trang danh sách. */
export function useCreateCallbacks(): CreateCallbacks {
  const { t } = useTranslation("lessonManage");
  const navigate = useNavigate();
  const open = (created: CreatedLesson) => ({
    label: t("create.open"),
    onClick: () => navigate(`${TEACHER_LESSONS_PATH}/${created.id}`),
  });
  return {
    onDone: (created) => {
      toast(
        t("create.done", {
          title: created.title,
          count: created.sentenceCount,
          charged: created.creditsCharged,
          balance: created.creditBalance,
        }),
        {
          icon: "circle-check",
          action: open(created),
        },
      );
    },
    onFailed: (job) => {
      toast(t("create.failedToast", { reason: errorMessage(t, job.error) }), { icon: "circle-alert" });
    },
  };
}
