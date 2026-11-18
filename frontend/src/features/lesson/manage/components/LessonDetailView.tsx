import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import ErrorState from "@/components/common/ErrorState";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { errorMessage } from "../errors";
import { useLessonDetail } from "../hooks";
import { ADMIN_LESSONS_PATH, TEACHER_LESSONS_PATH } from "../paths";
import type { LessonApiError, ManageRole } from "../types";
import LessonWorkspace from "./LessonWorkspace";

/**
 * Trang bài học (UC-BH-02): tải bài rồi giao cho `LessonWorkspace`. Giáo viên chủ bài xem và sửa câu ngay trên trang
 * (UC-BH-05, UC-BH-10); quản trị viên chỉ xem và gỡ xuất bản.
 */
export default function LessonDetailView({ role, lessonId }: Readonly<{ role: ManageRole; lessonId: string }>) {
  const { t } = useTranslation("lessonManage");
  const navigate = useNavigate();
  const listPath = role === "teacher" ? TEACHER_LESSONS_PATH : ADMIN_LESSONS_PATH;
  const query = useLessonDetail(role, lessonId);

  if (query.isLoading) return <Skeleton className="h-96 w-full" />;
  if (query.isError || !query.data) {
    const error = query.error as unknown as LessonApiError | null;
    if (error?.kind === "notFound" || error?.kind === "forbidden") {
      return (
        <div className="flex flex-col items-start gap-3">
          <FormAlert variant="danger">{errorMessage(t, error)}</FormAlert>
          <Button variant="secondary" onClick={() => navigate(listPath)} leftIcon={<Icon name="arrow-left" />}>
            {t("detail.backToList")}
          </Button>
        </div>
      );
    }
    return <ErrorState kind={error?.kind === "network" ? "network" : "server"} onRetry={() => void query.refetch()} />;
  }
  return <LessonWorkspace key={query.data.id} role={role} lesson={query.data} />;
}
