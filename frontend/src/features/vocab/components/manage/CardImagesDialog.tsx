import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import { toast } from "@/stores/toastStore";
import { deckContentApi } from "../../deckContentApi";
import {
  attachImagesInBatches,
  contentFailure,
  type BulkImageSummary,
  type ContentFailure,
} from "../../deckContentForm";
import { deckManageKeys } from "../../deckManageHooks";
import type { DeckApiError, DeckGroup } from "../../deckManageTypes";

export interface CardImagesDialogProps {
  deckId: string;
  group: DeckGroup;
  onClose: () => void;
  onFailure: (failure: ContentFailure) => void;
}

const TITLE_ID = "card-images-title";
/** Hiện tối đa chừng này tên tệp trong mỗi nhóm lỗi; còn lại gộp thành "… và N tệp khác". */
const MAX_NAMES = 12;

/**
 * Gắn ảnh hàng loạt (UC-NT-08, BR-NT-09): giáo viên chọn nhiều ảnh đặt tên theo từ vựng (vd `sustain.jpg`), hệ thống
 * tải lên rồi ghép với thẻ của nhóm theo tên tệp. Ảnh không khớp, trùng thẻ hoặc sai định dạng được liệt kê theo tên
 * tệp và không gắn; ảnh khớp thay ảnh cũ của thẻ.
 */
export default function CardImagesDialog({ deckId, group, onClose, onFailure }: Readonly<CardImagesDialogProps>) {
  const { t } = useTranslation("vocab");
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [summary, setSummary] = useState<BulkImageSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const running = progress !== null && summary === null && !failed;

  const start = async () => {
    setFailed(false);
    setSummary(null);
    setProgress({ done: 0, total: files.length });
    try {
      const result = await attachImagesInBatches(
        files,
        deckContentApi.uploadCardImage,
        (items) => deckContentApi.attachImages(deckId, group.id, items),
        (done, total) => setProgress({ done, total }),
      );
      setSummary(result);
      if (result.attached.length > 0) {
        toast(t("content.images.done", { count: result.attached.length }), { icon: "circle-check" });
      }
    } catch (e) {
      const failure = contentFailure(e as DeckApiError);
      if (failure.kind === "retry" || failure.kind === "fields") {
        setFailed(true);
      } else {
        onFailure(failure);
        onClose();
      }
    } finally {
      void queryClient.invalidateQueries({ queryKey: deckManageKeys.all });
    }
  };

  const names = (key: string, list: string[]) => {
    if (list.length === 0) return null;
    const shown = list.slice(0, MAX_NAMES);
    return (
      <li>
        <span className="font-semibold">{t(`content.images.result.${key}`, { count: list.length })}</span>{" "}
        <span className="break-all">{shown.join(", ")}</span>
        {list.length > shown.length && <span> {t("content.images.more", { count: list.length - shown.length })}</span>}
      </li>
    );
  };

  return (
    <Dialog open onClose={running ? () => undefined : onClose} labelledBy={TITLE_ID} wide>
      <div className="flex max-h-[80vh] flex-col gap-4">
        <div>
          <h2 id={TITLE_ID} className="text-lg font-bold text-text">
            {t("content.images.title")}
          </h2>
          <p className="text-sm text-text-muted">{t("content.images.intoGroup", { name: group.name })}</p>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto">
          <p className="text-[13px] leading-normal text-text-muted">{t("content.images.rules")}</p>

          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={(e) => {
              setFiles(Array.from(e.target.files ?? []));
              setSummary(null);
              setProgress(null);
              setFailed(false);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={running}
            onClick={() => input.current?.click()}
            className="flex items-center gap-3 rounded-lg border border-dashed border-border-strong p-4 text-left hover:bg-surface-hover disabled:opacity-60"
          >
            <Icon name="image-plus" className="text-2xl text-fn-vocab" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold text-text">
                {files.length > 0 ? t("content.images.chosen", { count: files.length }) : t("content.images.choose")}
              </span>
              {files.length > 0 && <span className="text-[13px] text-text-muted">{t("content.images.change")}</span>}
            </span>
          </button>

          {running && progress && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-text-muted">
                {t("content.images.uploading", { done: progress.done, total: progress.total })}
              </p>
              <ProgressBar
                value={progress.total === 0 ? 100 : (progress.done / progress.total) * 100}
                label={t("content.images.uploading", { done: progress.done, total: progress.total })}
              />
            </div>
          )}

          {summary && (
            <FormAlert variant={summary.attached.length > 0 ? "success" : "warning"} role="status">
              <p className="font-semibold">{t("content.images.attached", { count: summary.attached.length })}</p>
              <ul className="mt-1 flex flex-col gap-1 text-[13px]">
                {names("unmatched", summary.unmatched)}
                {names("duplicated", summary.duplicated)}
                {names("invalid", summary.invalid)}
                {names("failed", summary.failed)}
              </ul>
            </FormAlert>
          )}
          {failed && <FormAlert variant="danger">{t("content.images.failed")}</FormAlert>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose} disabled={running}>
            {t(summary ? "content.images.close" : "content.images.cancel")}
          </Button>
          {!summary && (
            <Button
              leftIcon={<Icon name="upload" />}
              disabled={files.length === 0}
              isLoading={running}
              onClick={() => void start()}
            >
              {t("content.images.confirm")}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
