import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { useRequestRepublish, useTakedownStatus } from "../hooks";
import { REPORT_TEXT_MAX, validateNote } from "../reportForm";
import type { ReportApiError, RepublishTarget, TakedownItem } from "../types";

const CONFIRM_TITLE = "republish-confirm-title";

export interface TakedownNoticeProps {
  targetType: RepublishTarget;
  targetId: string;
  /**
   * Mốc cập nhật của bài học hoặc bộ thẻ trên trang; đổi (giáo viên vừa sửa nội dung) thì tải lại trạng thái "Đã sửa"
   * của từng nội dung bị báo mà không cần tải lại trang.
   */
  contentVersion?: string;
}

/**
 * Khung báo bài học hoặc bộ thẻ "Bị quản trị viên gỡ" trên trang của giáo viên (BR-XL-13): lý do gỡ, lý do từ chối lần
 * trước nếu có, danh sách câu hoặc thẻ trong bản chụp lúc gỡ kèm đã sửa hay chưa, và nút gửi yêu cầu duyệt xuất bản lại
 * kèm ghi chú (UC-BH-06, UC-BT-05 nhánh 2b). Nút chỉ bật khi mọi nội dung trong bản chụp đã được sửa (2c), hoặc ngay khi
 * bản chụp rỗng (gỡ tay không kèm báo cáo, ghi chú bắt buộc); đã có yêu cầu đang chờ (2d) thì báo lại. Không mang dấu
 * thì không hiện gì.
 */
export default function TakedownNotice({ targetType, targetId, contentVersion }: Readonly<TakedownNoticeProps>) {
  const { t } = useTranslation("report");
  const status = useTakedownStatus(targetType, targetId);
  const request = useRequestRepublish();
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<"NotBlank" | "Size" | null>(null);
  const { refetch } = status;
  const seenVersion = useRef(contentVersion);
  useEffect(() => {
    if (contentVersion && contentVersion !== seenVersion.current) {
      seenVersion.current = contentVersion;
      void refetch();
    }
  }, [contentVersion, refetch]);
  const data = status.data;
  if (!data?.takenDown) return null;

  const remaining = data.items.filter((item) => !item.fixed).length;

  const closeConfirm = () => {
    setConfirming(false);
    setNote("");
    setNoteError(null);
  };

  const send = () => {
    const text = note.trim();
    const error = data.noteRequired || text ? validateNote(text) : null;
    setNoteError(error);
    if (error) return;
    request.mutate(
      { targetType, targetId, note: text || null },
      {
        onSuccess: () => {
          toast(t("takedown.sent"), { icon: "circle-check" });
          closeConfirm();
        },
        onError: (error) => {
          const e = error as unknown as ReportApiError;
          const field = e.fieldErrors?.find((f) => f.field === "note");
          if (field) {
            setNoteError(field.code === "Size" ? "Size" : "NotBlank");
            return;
          }
          closeConfirm();
          // Danh sách bên dưới tự tải lại sau mỗi lần gửi nên chỉ cần nhắc ngắn.
          if (e.kind === "notFixed") {
            toast(t("takedown.stillUnfixed"), { icon: "circle-alert" });
          } else if (e.kind === "conflict") {
            toast(t("takedown.pending"), { icon: "circle-alert" });
          } else {
            toast(e.kind === "network" ? t("dialog.network") : t("dialog.failed"), { icon: "circle-alert" });
          }
        },
      },
    );
  };

  let hint = "takedown.readyHint";
  if (data.noteRequired) hint = "takedown.manualHint";
  else if (remaining > 0) hint = "takedown.hint";

  return (
    <FormAlert variant="warning">
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 font-semibold">
          <Icon name="eye-off" className="size-4" />
          {t(`takedown.title.${targetType}`)}
        </p>
        {data.reason && <p>{t("takedown.reason", { reason: data.reason })}</p>}
        {data.lastRejectReason && !data.pending && (
          <p>{t("takedown.lastRejected", { reason: data.lastRejectReason })}</p>
        )}
        {data.items.length > 0 && <ItemList targetType={targetType} items={data.items} />}
        <p className="text-text-muted">
          {data.pending ? t("takedown.pending") : t(hint)}
        </p>
        {!data.pending && (
          <div>
            <Button
              type="button"
              size="sm"
              leftIcon={<Icon name="send" />}
              onClick={() => setConfirming(true)}
              disabled={remaining > 0}
            >
              {t("takedown.request")}
            </Button>
          </div>
        )}
      </div>
      {confirming && (
        <Dialog open onClose={closeConfirm} labelledBy={CONFIRM_TITLE}>
          <div className="flex flex-col gap-4">
            <h2 id={CONFIRM_TITLE} className="text-lg font-bold text-text">
              {t("takedown.confirmTitle")}
            </h2>
            <p className="text-sm text-text">{t(`takedown.confirmBody.${targetType}`)}</p>
            {data.reason && <p className="text-sm text-text-muted">{t("takedown.reason", { reason: data.reason })}</p>}
            <label className="flex flex-col gap-1 text-sm text-text">
              {t(data.noteRequired ? "takedown.note" : "takedown.noteOptional")}
              <textarea
                className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-text"
                value={note}
                maxLength={REPORT_TEXT_MAX + 100}
                onChange={(e) => setNote(e.target.value)}
                aria-invalid={noteError !== null}
              />
              {noteError && (
                <span className="text-danger">
                  {t(noteError === "Size" ? "takedown.noteTooLong" : "takedown.noteRequired")}
                </span>
              )}
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={closeConfirm} disabled={request.isPending}>
                {t("dialog.cancel")}
              </Button>
              <Button
                type="button"
                leftIcon={<Icon name="send" />}
                onClick={send}
                isLoading={request.isPending}
                disabled={request.isPending}
              >
                {t("takedown.confirm")}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </FormAlert>
  );
}

function ItemList({ targetType, items }: Readonly<{ targetType: RepublishTarget; items: TakedownItem[] }>) {
  const { t } = useTranslation("report");
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5 text-sm">
      <p className="font-semibold text-text">{t(`takedown.items.${targetType}`, { count: items.length })}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-text">{item.label}</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${
                item.fixed ? "text-success" : "text-danger"
              }`}
            >
              <Icon name={item.fixed ? "circle-check" : "circle-x"} className="size-3.5" />
              {item.fixed ? t("takedown.fixed") : t("takedown.unfixed")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
