import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import { toast } from "@/stores/toastStore";
import { useRejectAllByReporter, useRejectReport, useResolveReport, useTakedownReport } from "../hooks";
import { REPORT_TEXT_MAX, validateNote } from "../reportForm";
import type { ReportApiError, ReviewRole } from "../types";

export type HandleMode = "resolve" | "reject" | "rejectAll" | "takedown";

export interface HandleReportDialogProps {
  role: ReviewRole;
  mode: HandleMode;
  /** Báo cáo đại diện cho dòng (resolve, reject, takedown). */
  reportId: string;
  /** Số báo cáo trong dòng, để nhắc thao tác áp dụng cho cả dòng (BR-XL-06). */
  groupSize: number;
  /** Học viên bị từ chối hàng loạt (rejectAll, BR-XL-14). */
  reporter?: { id: string; name: string };
  /** Bài học hoặc bộ thẻ sẽ bị gỡ và số báo cáo sẽ được đóng cùng (takedown, BR-XL-13). */
  takedown?: { containerName: string; count: number };
  onClose: () => void;
  /** Dòng đã đóng (hoặc đã được xử lý ở nơi khác): trang chi tiết quay về danh sách. */
  onDone: () => void;
}

const TITLE_ID = "handle-report-title";

/** Khóa dịch theo chế độ: tiêu đề, nhãn ô nhập, nút xác nhận, thông báo thành công. */
const TEXT: Record<HandleMode, { title: string; field: string; confirm: string; required: string; done: string }> = {
  resolve: {
    title: "dialog.resolveTitle",
    field: "dialog.note",
    confirm: "dialog.confirmResolve",
    required: "dialog.noteRequired",
    done: "dialog.resolveDone",
  },
  reject: {
    title: "dialog.rejectTitle",
    field: "dialog.reason",
    confirm: "dialog.confirmReject",
    required: "dialog.reasonRequired",
    done: "dialog.rejectDone",
  },
  rejectAll: {
    title: "dialog.rejectAllTitle",
    field: "dialog.reason",
    confirm: "dialog.confirmRejectAll",
    required: "dialog.reasonRequired",
    done: "dialog.rejectAllDone",
  },
  takedown: {
    title: "dialog.takedownTitle",
    field: "dialog.takedownReason",
    confirm: "dialog.confirmTakedown",
    required: "dialog.takedownReasonRequired",
    done: "dialog.takedownDone",
  },
};

/**
 * Hộp nhập ghi chú xử lý (UC-XL-02), lý do từ chối (UC-XL-03, nhánh 2a) hoặc lý do gỡ (UC-XL-04), bắt buộc 1 đến 500
 * ký tự (BR-XL-04). Nội dung chưa sửa đúng trường thì báo trường cần sửa (BR-XL-05) và giữ hộp; mất kết nối thì giữ nội
 * dung đã nhập.
 */
export default function HandleReportDialog(props: Readonly<HandleReportDialogProps>) {
  const { role, mode, reportId, groupSize, reporter, takedown, onClose, onDone } = props;
  const { t } = useTranslation("report");
  const resolve = useResolveReport();
  const reject = useRejectReport(role);
  const rejectAll = useRejectAllByReporter();
  const remove = useTakedownReport();
  const [note, setNote] = useState("");
  const [fieldError, setFieldError] = useState<"NotBlank" | "Size" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const pending = resolve.isPending || reject.isPending || rejectAll.isPending || remove.isPending;
  const text = TEXT[mode];

  const done = (message: string) => {
    toast(message, { icon: "circle-check" });
    onDone();
  };

  const fail = (error: unknown) => {
    const e = error as ReportApiError;
    if (e.kind === "notFixed") {
      const fields = Array.isArray(e.details.fields) ? (e.details.fields as string[]) : [];
      setFailure(t("dialog.notFixed", { fields: fields.map((f) => t(`fields.${f}`)).join(", ") }));
    } else if (e.kind === "conflict") {
      toast(t("dialog.alreadyHandled"), { icon: "circle-alert" });
      onDone();
    } else if (e.kind === "forbidden") {
      toast(t("dialog.forbidden"), { icon: "circle-alert" });
      onClose();
    } else if (e.kind === "validation") {
      setFieldError(e.fieldErrors[0]?.code === "Size" ? "Size" : "NotBlank");
    } else {
      setFailure(e.kind === "network" ? t("dialog.network") : t("dialog.failed"));
    }
  };

  const confirm = () => {
    setFailure(null);
    const error = validateNote(note);
    setFieldError(error);
    if (error) return;
    const value = note.trim();
    const callbacks = { onSuccess: () => done(t(text.done)), onError: fail };
    if (mode === "resolve") resolve.mutate({ reportId, note: value }, callbacks);
    else if (mode === "reject") reject.mutate({ reportId, note: value }, callbacks);
    else if (mode === "takedown") remove.mutate({ reportId, note: value }, callbacks);
    else if (reporter) {
      rejectAll.mutate(
        { studentId: reporter.id, note: value },
        { onSuccess: (count) => done(t("dialog.rejectAllDone", { count })), onError: fail },
      );
    }
  };

  let body = null;
  if (mode === "rejectAll") {
    body = <p className="text-sm text-text">{t("dialog.rejectAllBody")}</p>;
  } else if (mode === "takedown" && takedown) {
    body = (
      <div className="flex flex-col gap-2 text-sm text-text">
        <p>{t("dialog.takedownBody", { name: takedown.containerName })}</p>
        <p className="text-text-muted">{t("dialog.takedownCount", { count: takedown.count })}</p>
      </div>
    );
  } else if (groupSize > 1) {
    body = <p className="text-sm text-text-muted">{t("dialog.groupNote", { count: groupSize })}</p>;
  }

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t(text.title, { name: reporter?.name ?? "" })}
        </h2>
        {failure && <FormAlert variant="danger">{failure}</FormAlert>}
        {body}
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-text">
          <span>
            {t(text.field)}
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          </span>
          <textarea
            className={`min-h-24 rounded-md border bg-surface px-3.5 py-3 text-[15px] font-normal text-text outline-none transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_var(--primary-soft)] ${
              fieldError ? "border-danger" : "border-border-strong focus:border-primary"
            }`}
            value={note}
            maxLength={REPORT_TEXT_MAX + 100}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={fieldError !== null}
          />
          {fieldError && (
            <span className="font-normal text-danger">
              {fieldError === "Size" ? t("dialog.tooLong") : t(text.required)}
            </span>
          )}
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {t("dialog.cancel")}
          </Button>
          <Button
            type="button"
            variant={mode === "resolve" ? "primary" : "danger"}
            onClick={confirm}
            disabled={pending}
            isLoading={pending}
          >
            {t(text.confirm)}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
