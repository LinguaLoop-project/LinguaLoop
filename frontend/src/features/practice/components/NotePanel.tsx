import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { NOTE_MAX_LENGTH } from "../constants";
import { isNetworkError } from "../utils";

/** Phần của một mutation của TanStack Query mà ô ghi chú cần; truyền thẳng kết quả của `useMutation`. */
interface MutationLike<Variables> {
  mutate: (variables: Variables, options?: { onSuccess?: () => void }) => void;
  isPending: boolean;
  error: unknown;
}

export interface NotePanelProps {
  sentenceId: string;
  /** Ghi chú đã lưu; null nếu chưa có. */
  note: string | null;
  save: MutationLike<{ sentenceId: string; content: string }>;
  remove: MutationLike<string>;
}

/** Ô viết ghi chú riêng cho câu đang xem: lưu để thay nội dung, xoá để bỏ ghi chú. Dùng chung cho nghe chép và Shadowing. */
export default function NotePanel({ sentenceId, note, save, remove }: NotePanelProps) {
  const { t } = useTranslation("practice");
  const [value, setValue] = useState(note ?? "");
  const busy = save.isPending || remove.isPending;
  const error = save.error ?? remove.error;
  const canSave = value.trim() !== "" && value !== (note ?? "") && !busy;

  const onSave = () => {
    if (!canSave) return;
    save.mutate(
      { sentenceId, content: value },
      { onSuccess: () => toast(t("note.saved"), { icon: "check" }) },
    );
  };

  const onDelete = () => {
    remove.mutate(sentenceId, {
      onSuccess: () => {
        setValue("");
        toast(t("note.deleted"), { icon: "trash-2" });
      },
    });
  };

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-bg-elevated p-3">
      <label htmlFor={`note-${sentenceId}`} className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {t("note.title")}
      </label>
      <textarea
        id={`note-${sentenceId}`}
        autoFocus
        rows={3}
        maxLength={NOTE_MAX_LENGTH}
        value={value}
        placeholder={t("note.placeholder")}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            onSave();
          }
        }}
        className="w-full resize-y rounded-md border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {error != null && (
        <p role="alert" className="text-sm text-danger">
          {isNetworkError(error) ? t("note.offline") : t("note.failed")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-muted">
          {value.length}/{NOTE_MAX_LENGTH}
        </span>
        <span className="grow" />
        {note !== null && (
          <Button variant="ghost" size="sm" leftIcon={<Icon name="trash-2" />} disabled={busy} onClick={onDelete}>
            {t("note.delete")}
          </Button>
        )}
        <Button size="sm" isLoading={save.isPending} disabled={!canSave} onClick={onSave}>
          {t("note.save")}
        </Button>
      </div>
    </div>
  );
}
