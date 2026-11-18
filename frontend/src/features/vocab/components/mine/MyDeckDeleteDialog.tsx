import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import { toast } from "@/stores/toastStore";
import type { DeckApiError } from "../../deckManageTypes";
import { myDeckFailure, type MyDeck } from "../../myDecks";
import { useDeleteMyDeck } from "../../myDecksHooks";

export interface MyDeckDeleteDialogProps {
  deck: MyDeck;
  onClose: () => void;
}

const TITLE_ID = "my-deck-delete-title";

/** Xác nhận xóa bộ cá nhân (luồng 3b): các thẻ của bộ không còn vào hàng đợi ôn (BR-HT-25, AC-HT-56). */
export default function MyDeckDeleteDialog({ deck, onClose }: Readonly<MyDeckDeleteDialogProps>) {
  const { t } = useTranslation("vocab");
  const remove = useDeleteMyDeck();
  const [failed, setFailed] = useState(false);

  const confirm = () => {
    setFailed(false);
    remove.mutate(deck.id, {
      onSuccess: () => {
        toast(t("mine.feedback.deleted", { name: deck.name }), { icon: "circle-check" });
        onClose();
      },
      onError: (e) => {
        // Bộ đã không còn (xóa ở nơi khác): danh sách được tải lại nên chỉ cần đóng hộp.
        if (myDeckFailure(e as unknown as DeckApiError).kind === "retry") setFailed(true);
        else onClose();
      },
    });
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t("mine.delete.title")}
        </h2>
        <p className="text-sm text-text">{t("mine.delete.text", { name: deck.name })}</p>
        <p className="text-[13px] text-text-muted">{t("mine.delete.note", { count: deck.cardCount })}</p>
        {failed && <FormAlert variant="danger">{t("mine.feedback.deleteFailed")}</FormAlert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={remove.isPending}>
            {t("mine.delete.cancel")}
          </Button>
          <Button variant="danger" isLoading={remove.isPending} onClick={confirm}>
            {t("mine.delete.confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
