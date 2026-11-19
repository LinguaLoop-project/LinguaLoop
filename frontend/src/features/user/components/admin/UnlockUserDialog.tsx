import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { formatDateTime } from "../../adminFormat";
import { errorMessageKey } from "../../adminUsers";
import { useUnlockUser } from "../../hooks";
import type { AdminApiError, AdminUserDetail } from "../../types";

const TITLE_ID = "unlock-user-title";

/**
 * Hộp xác nhận mở khóa (UC-QT-03): nêu tên, email, ngày khóa và lý do khóa trước đó. Tài khoản vừa được quản trị viên
 * khác mở khóa thì báo và đóng; mất kết nối thì giữ hộp để thử lại.
 */
export default function UnlockUserDialog({ user, onClose }: Readonly<{ user: AdminUserDetail; onClose: () => void }>) {
  const { t, i18n } = useTranslation("userAdmin");
  const unlock = useUnlockUser();
  const [failure, setFailure] = useState<string | null>(null);

  const submit = () => {
    setFailure(null);
    unlock.mutate(user.id, {
      onSuccess: () => {
        toast(t("unlock.done", { name: user.displayName }), { icon: "circle-check" });
        onClose();
      },
      onError: (raw) => {
        const err = raw as unknown as AdminApiError;
        if (err.code === "USER_NOT_LOCKED") {
          toast(t("errors.USER_NOT_LOCKED"), { icon: "circle-alert" });
          onClose();
          return;
        }
        setFailure(errorMessageKey(err, "unlock.failed"));
      },
    });
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t("unlock.title")}
        </h2>
        {failure && <FormAlert variant="danger">{t(failure)}</FormAlert>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-text-muted">{t("list.colName")}</dt>
          <dd className="text-text">
            {user.displayName} · {user.email}
          </dd>
          <dt className="text-text-muted">{t("detail.lockedAt")}</dt>
          <dd className="text-text">{formatDateTime(user.lockedAt, i18n.language) ?? t("dash")}</dd>
          <dt className="text-text-muted">{t("detail.lockedReason")}</dt>
          <dd className="whitespace-pre-wrap break-words text-text">{user.lockedReason ?? t("dash")}</dd>
        </dl>
        <p className="text-sm text-text">{t("unlock.body")}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={unlock.isPending}>
            {t("cancel")}
          </Button>
          <Button type="button" isLoading={unlock.isPending} leftIcon={<Icon name="lock-open" />} onClick={submit}>
            {t("unlock.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
