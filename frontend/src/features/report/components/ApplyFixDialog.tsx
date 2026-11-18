import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import { toast } from "@/stores/toastStore";
import { useApplyFix } from "../hooks";
import type { ReportApiError, ReportEntry } from "../types";

const TITLE = "apply-fix-title";

export interface ApplyFixDialogProps {
  reportId: string;
  entry: ReportEntry;
  /** Giá trị hiện tại của trường cần sửa. */
  current: string | null;
  onClose: () => void;
  /** Báo cáo đã được xử lý ở nơi khác: quay về danh sách. */
  onGone: () => void;
}

/**
 * Hộp xác nhận áp dụng bản sửa đề xuất (UC-XL-02 nhánh 2a, 2b): giá trị hiện tại của trường cạnh bản sửa, "Áp dụng"
 * ghi bản sửa vào nội dung, "Hủy" đóng mà không đổi gì. Sau khi áp dụng, giáo viên vẫn đánh dấu đã xử lý (BR-XL-10).
 */
export default function ApplyFixDialog({ reportId, entry, current, onClose, onGone }: Readonly<ApplyFixDialogProps>) {
  const { t } = useTranslation("report");
  const apply = useApplyFix();
  const [failure, setFailure] = useState<string | null>(null);
  const field = entry.fixField ?? "";

  const confirm = () => {
    setFailure(null);
    apply.mutate(
      { reportId, entryId: entry.id },
      {
        onSuccess: () => {
          toast(t("applyFix.done"), { icon: "circle-check" });
          onClose();
        },
        onError: (error) => {
          const e = error as unknown as ReportApiError;
          if (e.code === "VOCAB_CARD_WORD_TAKEN") {
            setFailure(t("applyFix.wordTaken"));
          } else if (e.kind === "validation") {
            setFailure(t("applyFix.invalid"));
          } else if (e.kind === "conflict" || e.kind === "notFound") {
            toast(t("applyFix.gone"), { icon: "circle-alert" });
            onGone();
          } else {
            setFailure(e.kind === "network" ? t("dialog.network") : t("dialog.failed"));
          }
        },
      },
    );
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE} className="text-lg font-bold text-text">
          {t("applyFix.title", { field: t(`fields.${field}`) })}
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-md border border-border bg-bg-elevated p-3">
            <dt className="text-xs font-semibold text-text-muted">{t("applyFix.current")}</dt>
            <dd className="break-words text-text">{current ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-primary bg-primary-soft p-3">
            <dt className="text-xs font-semibold text-primary">{t("applyFix.suggested")}</dt>
            <dd className="break-words font-semibold text-text">{entry.suggestedFix}</dd>
          </div>
        </dl>
        <p className="text-sm text-text-muted">{t("applyFix.hint")}</p>
        {failure && <FormAlert variant="danger">{failure}</FormAlert>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={apply.isPending}>
            {t("dialog.cancel")}
          </Button>
          <Button type="button" onClick={confirm} isLoading={apply.isPending} disabled={apply.isPending}>
            {t("applyFix.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
