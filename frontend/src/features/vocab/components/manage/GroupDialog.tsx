import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import TextField from "@/components/common/TextField";
import { toast } from "@/stores/toastStore";
import { contentFailure, validateGroupName, type ContentFailure } from "../../deckContentForm";
import { useAddGroup, useRenameGroup } from "../../deckContentHooks";
import type { DeckApiError, DeckGroup } from "../../deckManageTypes";

export interface GroupDialogProps {
  deckId: string;
  /** `null` = thêm nhóm mới (UC-NT-01); có nhóm = đổi tên (UC-NT-02). */
  group: DeckGroup | null;
  onClose: () => void;
  /** Lỗi làm hộp không còn ý nghĩa (bộ, nhóm không còn, không có quyền, bộ đã xuất bản): trang xử lý rồi hộp đóng. */
  onFailure: (failure: ContentFailure) => void;
  onSaved?: (group: DeckGroup) => void;
}

const TITLE_ID = "group-dialog-title";

/**
 * Biểu mẫu nhóm thẻ: chỉ có tên (BR-NT-02). Lỗi tên hiện cạnh ô và giữ hộp mở để sửa (luồng 7a, 7b); mất kết nối giữ
 * nguyên tên đã nhập để lưu lại (luồng 8a); "Hủy" đóng hộp, không lưu gì (luồng 6a).
 */
export default function GroupDialog({ deckId, group, onClose, onFailure, onSaved }: Readonly<GroupDialogProps>) {
  const { t } = useTranslation("vocab");
  const add = useAddGroup(deckId);
  const rename = useRenameGroup(deckId);
  const [name, setName] = useState(group?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const pending = add.isPending || rename.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFailed(false);
    const invalid = validateGroupName(name);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    const callbacks = {
      onSuccess: (saved: DeckGroup) => {
        toast(t(group ? "content.feedback.groupRenamed" : "content.feedback.groupAdded", { name: saved.name }), {
          icon: "circle-check",
        });
        onSaved?.(saved);
        onClose();
      },
      onError: (e: unknown) => {
        const failure = contentFailure(e as DeckApiError);
        if (failure.kind === "fields") setError(failure.errors.name ?? "Duplicate");
        else if (failure.kind === "retry") setFailed(true);
        else {
          onFailure(failure);
          onClose();
        }
      },
    };
    if (group) rename.mutate({ groupId: group.id, name }, callbacks);
    else add.mutate(name, callbacks);
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t(group ? "content.group.renameTitle" : "content.group.addTitle")}
        </h2>
        {failed && <FormAlert variant="danger">{t("content.feedback.saveFailed")}</FormAlert>}
        <TextField
          id="group-name"
          label={t("content.group.name")}
          requiredMark
          placeholder={t("content.group.namePlaceholder")}
          value={name}
          maxLength={120}
          autoFocus
          error={error ? t(`content.group.errors.${error}`, { defaultValue: t("content.group.errors.NotBlank") }) : undefined}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t("content.group.cancel")}
          </Button>
          <Button type="submit" isLoading={pending}>
            {t("content.group.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
