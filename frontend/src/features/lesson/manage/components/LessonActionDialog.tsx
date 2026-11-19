import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import TextField from "@/components/common/TextField";
import { useHasPendingRepublish, useIsTakenDown, useOpenOffensiveCount } from "@/features/report";
import { toast } from "@/stores/toastStore";
import type { LessonAction } from "../actions";
import { errorMessage, isStaleError } from "../errors";
import { useDeleteLesson, usePublishLesson, useRestoreLesson, useUnpublishLesson } from "../hooks";
import type { LessonApiError, LessonStatus, ManageRole } from "../types";


export interface LessonActionTarget {
  id: string;
  title: string;
  status: LessonStatus;
  pro: boolean;
}

export interface LessonActionDialogProps {
  role: ManageRole;
  action: LessonAction;
  lesson: LessonActionTarget;
  onClose: () => void;
  /** Thao tác thành công (trang chi tiết dùng để về danh sách sau khi xóa). */
  onDone?: (action: LessonAction) => void;
  /** "Sửa câu" khi bài chưa đủ điều kiện xuất bản (UC-BH-06 2a). */
  onEditSentences?: (lessonId: string) => void;
}

const TITLE_ID = "lesson-action-title";
const REASON_MAX = 500;
const TITLE_MAX = 100;

interface PublishIssues {
  noSentences: boolean;
  missingTranslation: number[];
}

/**
 * Hộp xác nhận xuất bản (UC-BH-06), gỡ xuất bản (UC-BH-07), xóa (UC-BH-08), khôi phục (UC-BH-09). "Hủy" đóng hộp và
 * không đổi gì. Lỗi kết nối giữ hộp để thử lại; danh sách đã cũ thì báo, đóng hộp và làm mới.
 */
export default function LessonActionDialog({
  role,
  action,
  lesson,
  onClose,
  onDone,
  onEditSentences,
}: Readonly<LessonActionDialogProps>) {
  const { t } = useTranslation("lessonManage");
  const publish = usePublishLesson();
  const unpublish = useUnpublishLesson(role);
  const remove = useDeleteLesson();
  const restore = useRestoreLesson();
  // Dấu "Bị quản trị viên gỡ" của bài: xóa thì hủy yêu cầu đang chờ, khôi phục thì vẫn phải gửi duyệt (BR-XL-13).
  const markTarget = role === "teacher" && (action === "delete" || action === "restore") ? lesson.id : undefined;
  const takenDown = useIsTakenDown("lesson", markTarget);
  const pendingRequest = useHasPendingRepublish("lesson", markTarget);
  // Gỡ tay đóng cùng các báo cáo Phản cảm đang mở về câu của bài (AC-BH-80).
  const offensiveCount = useOpenOffensiveCount(
    "lesson",
    role === "admin" && action === "unpublish" ? lesson.id : undefined,
  );
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<PublishIssues | null>(null);
  const pending = publish.isPending || unpublish.isPending || remove.isPending || restore.isPending;

  const succeed = () => {
    toast(t(`action.${action}Done`, { title: lesson.title }), { icon: "circle-check" });
    onDone?.(action);
    onClose();
  };

  const fail = (error: unknown) => {
    const e = error as LessonApiError;
    if (e.code === "LESSON_NOT_PUBLISHABLE") {
      setIssues({
        noSentences: Boolean(e.details.noSentences),
        missingTranslation: (e.details.missingTranslation as number[] | undefined) ?? [],
      });
      return;
    }
    if (action === "restore" && e.code === "LESSON_TITLE_TAKEN") {
      setNewTitle((current) => current ?? lesson.title);
      setTitleError(t("form.titleTaken"));
      return;
    }
    if (e.kind === "validation" && e.fieldErrors.some((f) => f.field === "reason")) {
      setReasonError(t("action.reasonInvalid"));
      return;
    }
    if (e.kind === "validation" && e.fieldErrors.some((f) => f.field === "title")) {
      setTitleError(t("form.titleInvalid"));
      return;
    }
    if (isStaleError(e)) {
      toast(errorMessage(t, e), { icon: "circle-alert" });
      onClose();
      return;
    }
    setRetryMessage(errorMessage(t, e));
  };

  const confirm = () => {
    setRetryMessage(null);
    setReasonError(null);
    setTitleError(null);
    const callbacks = { onSuccess: succeed, onError: fail };
    if (action === "publish") {
      publish.mutate(lesson.id, callbacks);
    } else if (action === "delete") {
      remove.mutate(lesson.id, callbacks);
    } else if (action === "unpublish") {
      const trimmed = reason.trim();
      if (role === "admin" && (trimmed.length === 0 || [...trimmed].length > REASON_MAX)) {
        setReasonError(t("action.reasonInvalid"));
        return;
      }
      unpublish.mutate({ lessonId: lesson.id, reason: role === "admin" ? trimmed : null }, callbacks);
    } else {
      if (newTitle !== null) {
        const trimmed = newTitle.trim();
        if (trimmed.length === 0 || [...trimmed].length > TITLE_MAX) {
          setTitleError(t("form.titleInvalid"));
          return;
        }
      }
      restore.mutate({ lessonId: lesson.id, title: newTitle }, callbacks);
    }
  };

  const destructive = action === "delete" || action === "unpublish";

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t(`action.${action}Title`)}
        </h2>

        {retryMessage && <FormAlert variant="danger">{retryMessage}</FormAlert>}

        {issues ? (
          <FormAlert variant="warning">
            <p className="font-semibold">{t("action.notPublishable")}</p>
            <ul className="mt-1 list-disc pl-5">
              {issues.noSentences && <li>{t("action.noSentences")}</li>}
              {issues.missingTranslation.length > 0 && (
                <li>{t("action.missingTranslation", { list: issues.missingTranslation.map((n) => `#${n}`).join(", ") })}</li>
              )}
            </ul>
          </FormAlert>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-text">
            <p>{t(`action.${action}Body`, { title: lesson.title })}</p>
            {action === "publish" && (
              <p className="text-text-muted">{lesson.pro ? t("action.publishPro") : t("action.publishFree")}</p>
            )}
            {action === "delete" && lesson.status === "published" && (
              <p className="text-warning">{t("action.deletePublishedNote")}</p>
            )}
            {action === "unpublish" && offensiveCount > 0 && (
              <p>{t("action.offensiveCount", { count: offensiveCount })}</p>
            )}
            {action === "delete" && pendingRequest && <p className="text-warning">{t("action.pendingRequestNote")}</p>}
            {action === "restore" && takenDown && <p className="text-warning">{t("action.takenDownRestoreNote")}</p>}
          </div>
        )}

        {action === "unpublish" && role === "admin" && !issues && (
          <label className="flex flex-col gap-1 text-sm text-text">
            {t("action.reason")}
            <textarea
              className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-text"
              value={reason}
              maxLength={600}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={reasonError !== null}
            />
            {reasonError && <span className="text-danger">{reasonError}</span>}
          </label>
        )}

        {action === "restore" && newTitle !== null && (
          <TextField
            id="restore-title"
            label={t("action.newTitle")}
            value={newTitle}
            maxLength={120}
            onChange={(e) => setNewTitle(e.target.value)}
            error={titleError ?? undefined}
          />
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          {issues ? (
            onEditSentences && (
              <Button type="button" onClick={() => onEditSentences(lesson.id)} leftIcon={<Icon name="pencil-line" />}>
                {t("detail.editSentences")}
              </Button>
            )
          ) : (
            <Button
              type="button"
              variant={destructive ? "danger" : "primary"}
              isLoading={pending}
              onClick={confirm}
            >
              {t(`action.${action}Confirm`)}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
