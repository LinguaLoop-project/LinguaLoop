import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { errorMessageKey, REASON_MAX, validateLockReason } from "../../adminUsers";
import { useLockUser } from "../../hooks";
import type { AdminApiError, AdminUserDetail } from "../../types";
import { RoleBadge } from "./AdminBits";

const TITLE_ID = "lock-user-title";

export interface LockUserDialogProps {
  user: AdminUserDetail;
  onClose: () => void;
  /** "Giao toàn bộ nội dung" ngay sau khi khóa giáo viên còn nội dung (UC-QT-02 nhánh 6a). */
  onTransferAll: () => void;
}

/**
 * Hộp xác nhận khóa tài khoản (UC-QT-02): nêu tên, email, vai trò; với giáo viên nêu số nội dung và số báo cáo đang
 * chờ (BR-XL-12); bắt buộc lý do. "Hủy" giữ nguyên tài khoản; mất kết nối thì giữ hộp và lý do đã nhập.
 */
export default function LockUserDialog({ user, onClose, onTransferAll }: Readonly<LockUserDialogProps>) {
  const { t } = useTranslation("userAdmin");
  const lock = useLockUser();
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<"NotBlank" | "Size" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [lockedTeacher, setLockedTeacher] = useState(false);

  const content = user.content;
  const lessons = content ? content.publishedLessons + content.draftLessons : 0;
  const decks = content ? content.publishedDecks + content.draftDecks : 0;

  const submit = () => {
    setFailure(null);
    const error = validateLockReason(reason);
    setFieldError(error);
    if (error) return;
    lock.mutate(
      { userId: user.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast(t("lock.done", { name: user.displayName }), { icon: "circle-check" });
          if (user.role === "teacher" && lessons + decks > 0) setLockedTeacher(true);
          else onClose();
        },
        onError: (raw) => {
          const err = raw as unknown as AdminApiError;
          const field = err.fieldErrors.find((f) => f.field === "reason");
          if (field) {
            setFieldError(field.code === "Size" ? "Size" : "NotBlank");
            return;
          }
          if (err.code === "USER_ALREADY_LOCKED" || err.code === "USER_PROTECTED") {
            toast(t(`errors.${err.code}`), { icon: "circle-alert" });
            onClose();
            return;
          }
          setFailure(errorMessageKey(err, "lock.failed"));
        },
      },
    );
  };

  if (lockedTeacher) {
    return (
      <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
        <div className="flex flex-col gap-4">
          <h2 id={TITLE_ID} className="text-lg font-bold text-text">
            {t("lock.title")}
          </h2>
          <FormAlert variant="success">{t("lock.doneTeacher")}</FormAlert>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("close")}
            </Button>
            <Button type="button" leftIcon={<Icon name="arrow-left-right" />} onClick={onTransferAll}>
              {t("detail.transferAll")}
            </Button>
          </div>
        </div>
      </Dialog>
    );
  }

  const reasonErrors = { NotBlank: t("lock.reasonRequired"), Size: t("lock.reasonTooLong") };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t("lock.title")}
        </h2>
        {failure && <FormAlert variant="danger">{t(failure)}</FormAlert>}
        <div className="flex flex-col gap-1 text-sm">
          <p className="flex items-center gap-2 font-semibold text-text">
            {user.displayName} <RoleBadge role={user.role} />
          </p>
          <p className="text-text-muted">{user.email}</p>
        </div>
        <p className="text-sm text-text">{t("lock.intro")}</p>
        {user.role === "teacher" && content && (
          <FormAlert variant="warning">
            <p>
              {t("lock.teacherContent", { lessons, decks, reports: content.waitingTeacherReports })}
            </p>
            <p className="mt-1">{t("lock.teacherNote")}</p>
          </FormAlert>
        )}
        <label className="flex flex-col gap-1 text-sm text-text">
          {t("lock.reason")}
          <textarea
            className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-text"
            value={reason}
            maxLength={REASON_MAX + 100}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={fieldError !== null}
            aria-describedby={fieldError ? "lock-reason-error" : undefined}
          />
          <span className="self-end text-xs text-text-subtle">
            {reason.trim().length}/{REASON_MAX}
          </span>
        </label>
        {fieldError && (
          <p id="lock-reason-error" className="-mt-3 text-sm text-danger">
            {reasonErrors[fieldError]}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={lock.isPending}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="danger" isLoading={lock.isPending} leftIcon={<Icon name="lock" />} onClick={submit}>
            {t("lock.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
