import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { useRequestRepublish, useTakedownStatus } from "../hooks";
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
 * Khung báo bài học hoặc bộ thẻ "Bị gỡ do báo cáo" trên trang của giáo viên (BR-XL-13): lý do gỡ, lý do từ chối lần
 * trước nếu có, danh sách câu hoặc thẻ bị báo kèm đã sửa hay chưa, và nút gửi yêu cầu duyệt xuất bản lại (UC-BH-06,
 * UC-BT-05 nhánh 2b). Nút chỉ bật khi mọi nội dung bị báo đã được sửa (2c); đã có yêu cầu đang chờ (2d) thì báo lại.
 * Không mang dấu thì không hiện gì.
 */
export default function TakedownNotice({ targetType, targetId, contentVersion }: Readonly<TakedownNoticeProps>) {
  const { t } = useTranslation("report");
  const status = useTakedownStatus(targetType, targetId);
  const request = useRequestRepublish();
  const [confirming, setConfirming] = useState(false);
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

  const send = () =>
    request.mutate(
      { targetType, targetId },
      {
        onSuccess: () => toast(t("takedown.sent"), { icon: "circle-check" }),
        onSettled: () => setConfirming(false),
        onError: (error) => {
          const e = error as unknown as ReportApiError;
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
          {data.pending ? t("takedown.pending") : t(remaining > 0 ? "takedown.hint" : "takedown.readyHint")}
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
        <Dialog open onClose={() => setConfirming(false)} labelledBy={CONFIRM_TITLE}>
          <div className="flex flex-col gap-4">
            <h2 id={CONFIRM_TITLE} className="text-lg font-bold text-text">
              {t("takedown.confirmTitle")}
            </h2>
            <p className="text-sm text-text">{t(`takedown.confirmBody.${targetType}`)}</p>
            {data.reason && <p className="text-sm text-text-muted">{t("takedown.reason", { reason: data.reason })}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={request.isPending}>
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
