import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import TextField from "@/components/common/TextField";
import { useAuthStore } from "@/features/auth";
import { toast } from "@/stores/toastStore";
import { useDeckDetail } from "../../deckManageHooks";
import { myDeckPath } from "../../deckManagePaths";
import { validateMyDeckName } from "../../myDecks";
import { useMyDecks, useQuickAdd } from "../../myDecksHooks";
import {
  NEW_OPTION,
  loadLastChoice,
  pickDeckId,
  pickGroupId,
  quickAddFailure,
  saveLastChoice,
  type QuickAddFailure,
} from "../../quickAdd";

export interface QuickAddPanelProps {
  headword: string;
  meaningNo: number;
  /** Có khi từ được bấm trong một câu của bài học (BR-HT-28). */
  sentenceId?: string;
  onClose: () => void;
}

const SELECT =
  "h-9 w-full min-w-0 rounded-md border border-border bg-surface px-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-primary";

/**
 * Khung mở dưới một nghĩa: chọn bộ và nhóm rồi thêm thẻ vào "Bộ của tôi" (UC-HT-10). Điền sẵn bộ và nhóm dùng gần nhất;
 * chưa có bộ thì tạo bộ mới, bộ chưa có nhóm thì tạo nhóm "Từ mới" (BR-HT-28). Lỗi hiện trong khung và giữ khung mở để
 * chọn lại (từ đã có trong bộ, mất kết nối).
 */
export default function QuickAddPanel({ headword, meaningNo, sentenceId, onClose }: Readonly<QuickAddPanelProps>) {
  const { t } = useTranslation("vocab");
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const decks = useMyDecks();
  const quickAdd = useQuickAdd();
  const last = useMemo(() => loadLastChoice(userId), [userId]);

  const [deckSel, setDeckSel] = useState<string | null>(null);
  const [groupSel, setGroupSel] = useState<string | null>(null);
  const [deckName, setDeckName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [failure, setFailure] = useState<QuickAddFailure | null>(null);

  const deckList = useMemo(() => decks.data ?? [], [decks.data]);
  const deckId = deckSel ?? pickDeckId(deckList, last?.deckId);
  const newDeck = deckId === NEW_OPTION;
  const detail = useDeckDetail("learner", newDeck ? undefined : deckId);
  const groups = useMemo(() => detail.data?.groups ?? [], [detail.data]);
  const groupId = newDeck ? NEW_OPTION : (groupSel ?? pickGroupId(groups, last?.groupId));
  const newGroup = groupId === NEW_OPTION;
  const defaultGroupName = t("quickAdd.defaultGroup");
  const ready = !decks.isPending && (newDeck || !detail.isPending);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);
    if (newDeck) {
      const invalid = validateMyDeckName(deckName);
      if (invalid) {
        setFailure({ kind: "deckName", error: invalid });
        return;
      }
    }
    const newGroupName = (groupName.trim() || defaultGroupName).trim();
    quickAdd.mutate(
      {
        headword,
        meaningNo,
        sentenceId,
        deck: newDeck ? { newName: deckName.trim() } : { id: deckId },
        group: newGroup ? { newName: newGroupName } : { id: groupId },
      },
      {
        onSuccess: (result) => {
          saveLastChoice(userId, { deckId: result.deckId, groupId: result.groupId });
          const deck = newDeck ? deckName.trim() : (deckList.find((item) => item.id === result.deckId)?.name ?? "");
          const group = newGroup ? newGroupName : (groups.find((item) => item.id === result.groupId)?.name ?? "");
          toast(t("quickAdd.added", { word: headword, deck, group }), {
            icon: "circle-check",
            action: { label: t("quickAdd.viewDeck"), onClick: () => navigate(myDeckPath(result.deckId)) },
          });
          onClose();
        },
        onError: (error) => setFailure(quickAddFailure(error)),
      },
    );
  };

  const message = (): string | null => {
    if (!failure) return null;
    switch (failure.kind) {
      case "taken":
        return t("quickAdd.errors.taken", { word: headword, group: failure.groupName });
      case "meaningGone":
        return t("quickAdd.errors.meaningGone");
      case "forbidden":
        return t("quickAdd.errors.forbidden");
      case "gone":
        return t("quickAdd.errors.gone");
      case "retry":
        return t("quickAdd.errors.retry");
      default:
        return null;
    }
  };
  const text = message();
  const loadFailed = decks.isError || (!newDeck && detail.isError);
  const offline = isAxiosError(decks.error) && !decks.error.response;

  return (
    <form
      onSubmit={submit}
      aria-label={t("quickAdd.formAria", { word: headword })}
      className="flex w-full flex-col gap-2.5 rounded-lg border border-border bg-bg-elevated p-3"
      noValidate
    >
      {loadFailed ? (
        <FormAlert variant="danger">{offline ? t("quickAdd.errors.offline") : t("quickAdd.errors.loadFailed")}</FormAlert>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-text-muted">
            {t("quickAdd.deck")}
            <select
              className={SELECT}
              value={deckId}
              disabled={!ready || quickAdd.isPending}
              onChange={(e) => {
                setDeckSel(e.target.value);
                setGroupSel(null);
                setFailure(null);
              }}
            >
              {deckList.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
              <option value={NEW_OPTION}>{t("quickAdd.newDeck")}</option>
            </select>
          </label>
          {newDeck ? (
            <TextField
              id={`quick-deck-${headword}-${meaningNo}`}
              label={t("quickAdd.deckName")}
              value={deckName}
              maxLength={120}
              autoFocus
              error={failure?.kind === "deckName" ? t(`mine.dialog.errors.${failure.error}`) : undefined}
              onChange={(e) => setDeckName(e.target.value)}
            />
          ) : (
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-text-muted">
              {t("quickAdd.group")}
              <select
                className={SELECT}
                value={groupId}
                disabled={!ready || quickAdd.isPending}
                onChange={(e) => {
                  setGroupSel(e.target.value);
                  setFailure(null);
                }}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
                <option value={NEW_OPTION}>{groups.length === 0 ? defaultGroupName : t("quickAdd.newGroup")}</option>
              </select>
            </label>
          )}
          {(newDeck || newGroup) && (
            <TextField
              id={`quick-group-${headword}-${meaningNo}`}
              label={t("quickAdd.groupName")}
              value={groupName}
              placeholder={defaultGroupName}
              maxLength={120}
              error={failure?.kind === "groupName" ? t(`content.group.errors.${failure.error}`) : undefined}
              onChange={(e) => setGroupName(e.target.value)}
            />
          )}
        </div>
      )}
      {text && <FormAlert variant="danger">{text}</FormAlert>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={quickAdd.isPending}>
          {t("quickAdd.cancel")}
        </Button>
        <Button type="submit" size="sm" isLoading={quickAdd.isPending} disabled={!ready || loadFailed}>
          {t("quickAdd.submit")}
        </Button>
      </div>
    </form>
  );
}
