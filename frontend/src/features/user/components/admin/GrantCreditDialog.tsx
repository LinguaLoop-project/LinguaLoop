import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { formatNumber } from "../../adminFormat";
import { REASON_MAX } from "../../adminUsers";
import { useGrantCredit } from "../../hooks";
import type { AdminApiError, AdminUserDetail } from "../../types";

const TITLE_ID = "grant-credit-title";
const CREDIT_MAX = 1_000_000;

export interface GrantCreditDialogProps {
  user: AdminUserDetail;
  onClose: () => void;
}

/**
 * Cấp credit cho giáo viên (UC-GA-07, BR-GA-11): số credit nguyên từ 1 đến 1.000.000, ghi chú bắt buộc tối đa 500 ký
 * tự. Mất kết nối thì giữ hộp và thông tin đã nhập; tài khoản vừa bị khóa hoặc đổi vai trò thì đóng hộp và báo lỗi.
 */
export default function GrantCreditDialog({ user, onClose }: Readonly<GrantCreditDialogProps>) {
  const { t, i18n } = useTranslation("userAdmin");
  const grant = useGrantCredit();
  const [credits, setCredits] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ credits?: string; note?: string }>({});
  const [failure, setFailure] = useState<string | null>(null);

  const submit = () => {
    setFailure(null);
    const text = credits.trim();
    const amount = /^\d+$/.test(text) ? Number(text) : Number.NaN;
    const next: { credits?: string; note?: string } = {};
    if (!(amount >= 1 && amount <= CREDIT_MAX)) next.credits = t("grant.creditsInvalid");
    if (note.trim().length === 0) next.note = t("grant.noteRequired");
    else if (note.trim().length > REASON_MAX) next.note = t("grant.noteTooLong");
    setErrors(next);
    if (next.credits || next.note) return;
    grant.mutate(
      { userId: user.id, credits: amount, note: note.trim() },
      {
        onSuccess: (detail) => {
          toast(
            t("grant.done", {
              credits: formatNumber(amount, i18n.language),
              name: user.displayName,
              balance: formatNumber(detail.creditBalance ?? 0, i18n.language),
            }),
            { icon: "circle-check" },
          );
          onClose();
        },
        onError: (raw) => {
          const err = raw as unknown as AdminApiError;
          if (err.code === "CREDIT_GRANT_NOT_ALLOWED") {
            toast(t("errors.CREDIT_GRANT_NOT_ALLOWED"), { icon: "circle-alert" });
            onClose();
            return;
          }
          const fieldErrors: { credits?: string; note?: string } = {};
          err.fieldErrors.forEach((f) => {
            if (f.field === "credits") fieldErrors.credits = t("grant.creditsInvalid");
            if (f.field === "note") fieldErrors.note = t("grant.noteRequired");
          });
          if (fieldErrors.credits || fieldErrors.note) {
            setErrors(fieldErrors);
            return;
          }
          setFailure(t("grant.failed"));
        },
      },
    );
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t("grant.title")}
        </h2>
        {failure && <FormAlert variant="danger">{failure}</FormAlert>}
        <p className="text-sm text-text">
          {t("grant.intro", { name: user.displayName, balance: formatNumber(user.creditBalance ?? 0, i18n.language) })}
        </p>
        <label className="flex flex-col gap-1 text-sm text-text">
          {t("grant.credits")}
          <input
            inputMode="numeric"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            aria-invalid={errors.credits ? true : undefined}
            className={`h-10 rounded-md border bg-surface px-3 text-text ${errors.credits ? "border-danger" : "border-border"}`}
          />
          {errors.credits && <span className="text-danger">{errors.credits}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm text-text">
          {t("grant.note")}
          <textarea
            className={`min-h-20 rounded-md border bg-surface px-3 py-2 text-text ${errors.note ? "border-danger" : "border-border"}`}
            value={note}
            maxLength={REASON_MAX + 100}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={errors.note ? true : undefined}
          />
          <span className="self-end text-xs text-text-subtle">
            {note.trim().length}/{REASON_MAX}
          </span>
          {errors.note && <span className="text-danger">{errors.note}</span>}
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={grant.isPending}>
            {t("cancel")}
          </Button>
          <Button type="button" isLoading={grant.isPending} leftIcon={<Icon name="plus" />} onClick={submit}>
            {t("grant.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
