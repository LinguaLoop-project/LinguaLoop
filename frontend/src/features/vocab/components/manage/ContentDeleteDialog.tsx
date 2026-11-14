import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import { toast } from "@/stores/toastStore";
import { contentFailure, type ContentFailure } from "../../deckContentForm";
import { useDeleteCard, useDeleteGroup } from "../../deckContentHooks";
import type { DeckApiError, DeckCard, DeckGroup } from "../../deckManageTypes";

/** Đối tượng cần xóa: một nhóm (UC-NT-03) hoặc một thẻ của nhóm (UC-NT-06). */
export type DeleteTarget = { kind: "group"; group: DeckGroup } | { kind: "card"; group: DeckGroup; card: DeckCard };

export interface ContentDeleteDialogProps {
  deckId: string;
  target: DeleteTarget;
  onClose: () => void;
  onFailure: (failure: ContentFailure) => void;
  onDeleted?: () => void;
}

const TITLE_ID = "content-delete-title";

/**
 * Hộp xác nhận xóa nhóm thẻ (nêu số thẻ bị xóa theo) hoặc xóa thẻ (nêu từ vựng), BR-NT-04. "Hủy" giữ nguyên (luồng
 * 5a, 6a); mất kết nối giữ hộp để thử lại (luồng 6a, 7a).
 */
export default function ContentDeleteDialog({ deckId, target, onClose, onFailure, onDeleted }: Readonly<ContentDeleteDialogProps>) {
  const { t } = useTranslation("vocab");
  const deleteGroup = useDeleteGroup(deckId);
  const deleteCard = useDeleteCard(deckId, target.group.id);
  const [failed, setFailed] = useState(false);
  const pending = deleteGroup.isPending || deleteCard.isPending;

  const callbacks = {
    onSuccess: () => {
      toast(
        target.kind === "group"
          ? t("content.feedback.groupDeleted", { name: target.group.name })
          : t("content.feedback.cardDeleted", { word: target.card.word }),
        { icon: "circle-check" },
      );
      onDeleted?.();
      onClose();
    },
    onError: (e: unknown) => {
      const failure = contentFailure(e as DeckApiError);
      if (failure.kind === "retry" || failure.kind === "fields") {
        setFailed(true);
        return;
      }
      onFailure(failure);
      onClose();
    },
  };

  const confirm = () => {
    setFailed(false);
    if (target.kind === "group") deleteGroup.mutate(target.group.id, callbacks);
    else deleteCard.mutate(target.card.id, callbacks);
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t(target.kind === "group" ? "content.delete.groupTitle" : "content.delete.cardTitle")}
        </h2>
        <p className="text-sm text-text">
          {target.kind === "group"
            ? t("content.delete.groupText", { name: target.group.name, count: target.group.cardCount })
            : t("content.delete.cardText", { word: target.card.word })}
        </p>
        <p className="text-[13px] text-text-muted">{t("content.delete.progressNote")}</p>
        {failed && <FormAlert variant="danger">{t("content.feedback.deleteFailed")}</FormAlert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t("content.delete.cancel")}
          </Button>
          <Button variant="danger" isLoading={pending} onClick={confirm}>
            {t("content.delete.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
