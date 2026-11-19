import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { formatDate, formatNumber } from "../../adminFormat";
import { errorMessageKey } from "../../adminUsers";
import { useChangeRole } from "../../hooks";
import type { AdminApiError, AdminUserDetail, ChangeableRole } from "../../types";

const TITLE_ID = "change-role-title";

type Blocked = { kind: "content"; lessons: number; decks: number } | { kind: "pro"; endsAt: string } | { kind: "message"; key: string };

export interface ChangeRoleDialogProps {
  user: AdminUserDetail;
  onClose: () => void;
  /** "Giao toàn bộ nội dung" khi giáo viên còn nội dung (UC-QT-04 nhánh 5c). */
  onTransferAll: () => void;
}

/**
 * Hộp xác nhận đổi vai trò giữa Học viên và Giáo viên (UC-QT-04): nêu vai trò hiện tại và mới; với giáo viên còn credit
 * nêu số credit sẽ bị hủy (BR-QT-04). Điều kiện do máy chủ kiểm và báo lại trong hộp.
 */
export default function ChangeRoleDialog({ user, onClose, onTransferAll }: Readonly<ChangeRoleDialogProps>) {
  const { t, i18n } = useTranslation("userAdmin");
  const change = useChangeRole();
  const target: ChangeableRole = user.role === "teacher" ? "student" : "teacher";
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const submit = () => {
    setFailure(null);
    change.mutate(
      { userId: user.id, role: target },
      {
        onSuccess: () => {
          toast(t("role.done", { name: user.displayName, role: t(`roles.${target}`) }), { icon: "circle-check" });
          onClose();
        },
        onError: (raw) => {
          const err = raw as unknown as AdminApiError;
          if (err.code === "USER_TEACHER_HAS_CONTENT") {
            setBlocked({ kind: "content", lessons: Number(err.details.lessons ?? 0), decks: Number(err.details.decks ?? 0) });
          } else if (err.code === "USER_ACTIVE_PRO") {
            setBlocked({ kind: "pro", endsAt: String(err.details.endsAt ?? "") });
          } else if (err.kind === "conflict" || err.kind === "forbidden") {
            setBlocked({ kind: "message", key: errorMessageKey(err, "role.failed") });
          } else {
            setFailure(errorMessageKey(err, "role.failed"));
          }
        },
      },
    );
  };

  const credit = user.creditBalance ?? 0;

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t("role.title")}
        </h2>
        {failure && <FormAlert variant="danger">{t(failure)}</FormAlert>}
        <p className="text-sm text-text">
          <span className="font-semibold">{user.displayName}</span> ·{" "}
          {t("role.change", { from: t(`roles.${user.role}`), to: t(`roles.${target}`) })}
        </p>
        {!blocked && (
          <ul className="list-disc pl-5 text-sm text-text-muted">
            {target === "student" && credit > 0 && (
              <li className="text-warning">{t("role.creditCanceled", { count: credit, formatted: formatNumber(credit, i18n.language) })}</li>
            )}
            {target === "teacher" && <li>{t("role.toTeacher")}</li>}
            <li>{t("role.personalKept")}</li>
          </ul>
        )}
        {blocked?.kind === "content" && (
          <FormAlert variant="warning">{t("role.hasContent", { lessons: blocked.lessons, decks: blocked.decks })}</FormAlert>
        )}
        {blocked?.kind === "pro" && (
          <FormAlert variant="warning">
            {t("role.activePro", { date: formatDate(blocked.endsAt, i18n.language) ?? blocked.endsAt })}
          </FormAlert>
        )}
        {blocked?.kind === "message" && <FormAlert variant="warning">{t(blocked.key)}</FormAlert>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={change.isPending}>
            {blocked ? t("close") : t("cancel")}
          </Button>
          {blocked?.kind === "content" && (
            <Button type="button" leftIcon={<Icon name="arrow-left-right" />} onClick={onTransferAll}>
              {t("detail.transferAll")}
            </Button>
          )}
          {!blocked && (
            <Button type="button" isLoading={change.isPending} leftIcon={<Icon name="user" />} onClick={submit}>
              {t("role.confirm")}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
