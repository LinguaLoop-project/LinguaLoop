import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import TextField from "@/components/common/TextField";
import { toast } from "@/stores/toastStore";
import type { DeckApiError } from "../../deckManageTypes";
import { myDeckFailure, validateMyDeckName, type MyDeck, type MyDeckNameError } from "../../myDecks";
import { useCreateMyDeck, useRenameMyDeck } from "../../myDecksHooks";

export interface MyDeckDialogProps {
  /** `null` = thêm bộ mới (AC-HT-55); có bộ = đổi tên (AC-HT-56). */
  deck: MyDeck | null;
  onClose: () => void;
  /** Bộ không còn hoặc không còn quyền: hộp đóng, trang tải lại danh sách. */
  onGone: () => void;
}

const TITLE_ID = "my-deck-dialog-title";
const NAME_MAX = 100;

/**
 * Biểu mẫu bộ cá nhân: chỉ có tên (BR-HT-25). Lỗi tên (trống, quá dài, trùng) hiện ngay dưới ô và giữ hộp mở để sửa
 * (luồng 4a, AC-HT-57); mất kết nối giữ nguyên tên đã nhập để lưu lại.
 */
export default function MyDeckDialog({ deck, onClose, onGone }: Readonly<MyDeckDialogProps>) {
  const { t } = useTranslation("vocab");
  const create = useCreateMyDeck();
  const rename = useRenameMyDeck();
  const [name, setName] = useState(deck?.name ?? "");
  const [error, setError] = useState<MyDeckNameError | null>(null);
  const [failed, setFailed] = useState(false);
  const pending = create.isPending || rename.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFailed(false);
    const invalid = validateMyDeckName(name);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    const callbacks = {
      onSuccess: (saved: MyDeck) => {
        toast(t(deck ? "mine.feedback.renamed" : "mine.feedback.created", { name: saved.name }), { icon: "circle-check" });
        onClose();
      },
      onError: (e: unknown) => {
        const failure = myDeckFailure(e as DeckApiError);
        if (failure.kind === "name") setError(failure.error);
        else if (failure.kind === "retry") setFailed(true);
        else {
          onGone();
          onClose();
        }
      },
    };
    if (deck) rename.mutate({ id: deck.id, name: name.trim() }, callbacks);
    else create.mutate(name.trim(), callbacks);
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t(deck ? "mine.dialog.renameTitle" : "mine.dialog.addTitle")}
        </h2>
        {failed && <FormAlert variant="danger">{t("mine.feedback.saveFailed")}</FormAlert>}
        <TextField
          id="my-deck-name"
          label={t("mine.dialog.name")}
          requiredMark
          placeholder={t("mine.dialog.namePlaceholder")}
          value={name}
          maxLength={NAME_MAX + 20}
          autoFocus
          error={error ? t(`mine.dialog.errors.${error}`) : undefined}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t("mine.dialog.cancel")}
          </Button>
          <Button type="submit" isLoading={pending}>
            {t("mine.dialog.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
