import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import TextField from "@/components/common/TextField";
import { toast } from "@/stores/toastStore";
import { validateDeckName } from "../../createDeckForm";
import {
  actionFailure,
  canPublish,
  publishIssues,
  validateUnpublishReason,
  type LifecycleAction,
  type PublishIssues,
} from "../../deckLifecycle";
import {
  useDeckDetail,
  useDeleteDeck,
  usePublishDeck,
  useRestoreDeck,
  useUnpublishDeck,
} from "../../deckManageHooks";
import type { DeckApiError, DeckStatus, ManageRole } from "../../deckManageTypes";

/** Thông tin bộ hiện trong hộp xác nhận. */
export interface DeckActionTarget {
  id: string;
  name: string;
  status: DeckStatus;
  categoryName: string | null;
  cardCount: number;
  pro: boolean;
}

export interface DeckActionDialogProps {
  role: ManageRole;
  action: LifecycleAction;
  deck: DeckActionTarget;
  onClose: () => void;
  /** Thao tác thành công (để trang chi tiết chuyển về danh sách sau khi xóa). */
  onDone?: (action: LifecycleAction) => void;
  /** "Sửa bộ này" khi bộ chưa đủ điều kiện xuất bản (UC-BT-05 2a). */
  onEdit?: (deckId: string) => void;
}

const TITLE_ID = "deck-action-title";

/**
 * Hộp xác nhận xuất bản (UC-BT-05), gỡ xuất bản (UC-BT-06), xóa (UC-BT-07), khôi phục (UC-BT-08). "Hủy" đóng hộp và
 * không đổi gì. Thành công thì báo và làm mới danh sách; mất kết nối thì giữ hộp để thử lại.
 */
export default function DeckActionDialog({ role, action, deck, onClose, onDone, onEdit }: DeckActionDialogProps) {
  const { t } = useTranslation("vocab");
  const publish = usePublishDeck();
  const unpublish = useUnpublishDeck(role);
  const remove = useDeleteDeck();
  const restore = useRestoreDeck();
  // Bước 2 của UC-BT-05: kiểm điều kiện xuất bản trước khi hỏi xác nhận.
  const detail = useDeckDetail("teacher", action === "publish" ? deck.id : undefined);
  const [reason, setReason] = useState("");
  const [newName, setNewName] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<string | null>(null);
  const [serverIssues, setServerIssues] = useState<PublishIssues | null>(null);
  const pending = publish.isPending || unpublish.isPending || remove.isPending || restore.isPending;

  const groups = detail.data?.groups ?? [];
  const issues = serverIssues ?? (detail.data ? publishIssues(groups) : null);
  const blocked = action === "publish" && issues !== null && !canPublish(issues);

  const succeed = () => {
    toast(t(`manage.feedback.${action}Done`, { name: deck.name }), { icon: "circle-check" });
    onDone?.(action);
    onClose();
  };

  const fail = (error: unknown) => {
    const failure = actionFailure(action, error as DeckApiError);
    switch (failure.kind) {
      case "close":
        toast(t(failure.messageKey), { icon: "circle-alert" });
        onClose();
        return;
      case "retry":
        setRetryKey(failure.messageKey);
        return;
      case "issues":
        setServerIssues(failure.issues);
        return;
      case "needName":
        setNewName((current) => current ?? deck.name);
        setFieldError("Duplicate");
        return;
      case "field":
        setFieldError(failure.code);
    }
  };

  const confirm = () => {
    setRetryKey(null);
    setFieldError(null);
    const callbacks = { onSuccess: succeed, onError: fail };
    if (action === "publish") publish.mutate(deck.id, callbacks);
    else if (action === "delete") remove.mutate(deck.id, callbacks);
    else if (action === "unpublish") {
      if (role === "admin") {
        const error = validateUnpublishReason(reason);
        if (error) {
          setFieldError(error);
          return;
        }
      }
      unpublish.mutate({ deckId: deck.id, reason: role === "admin" ? reason.trim() : null }, callbacks);
    } else {
      if (newName !== null) {
        const error = validateDeckName(newName);
        if (error) {
          setFieldError(error);
          return;
        }
      }
      restore.mutate({ deckId: deck.id, name: newName }, callbacks);
    }
  };

  const nameErrors: Record<string, string> = {
    NotBlank: t("manage.form.nameRequired"),
    Size: t("manage.form.nameTooLong"),
    Duplicate: t("manage.dialog.restoreNameTaken"),
  };
  const reasonErrors: Record<string, string> = {
    NotBlank: t("manage.dialog.reasonRequired"),
    Size: t("manage.dialog.reasonTooLong"),
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {t(`manage.dialog.${action}Title`)}
        </h2>

        {retryKey && <FormAlert variant="danger">{t(retryKey)}</FormAlert>}

        {action === "publish" && detail.isLoading && <Skeleton className="h-24 w-full" />}
        {action === "publish" && detail.isError && !serverIssues && (
          <FormAlert variant="danger">{t("manage.feedback.publishFailed")}</FormAlert>
        )}

        {blocked && issues && (
          <FormAlert variant="warning">
            <p className="font-semibold">{t("manage.dialog.notPublishable")}</p>
            <ul className="mt-1 list-disc pl-5">
              {issues.noGroups && <li>{t("manage.dialog.noGroups")}</li>}
              {issues.emptyGroups.map((name) => (
                <li key={name}>{t("manage.dialog.emptyGroup", { name })}</li>
              ))}
            </ul>
          </FormAlert>
        )}

        {action === "publish" && !blocked && detail.data && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-text-muted">{t("manage.form.name")}</dt>
            <dd className="text-text">{deck.name}</dd>
            <dt className="text-text-muted">{t("manage.category")}</dt>
            <dd className="text-text">{deck.categoryName ?? t("manage.otherCategory")}</dd>
            <dt className="text-text-muted">{t("manage.dialog.content")}</dt>
            <dd className="text-text">
              {t("manage.counts", { groups: groups.length, cards: detail.data.cardCount })}
            </dd>
            <dt className="text-text-muted">{t("manage.form.pro")}</dt>
            <dd className="text-text">{deck.pro ? t("manage.dialog.yes") : t("manage.dialog.no")}</dd>
          </dl>
        )}

        {action === "unpublish" && (
          <p className="text-sm text-text">{t("manage.dialog.unpublishBody", { name: deck.name })}</p>
        )}
        {action === "unpublish" && role === "admin" && (
          <label className="flex flex-col gap-1 text-sm text-text">
            {t("manage.dialog.reason")}
            <textarea
              className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-text"
              value={reason}
              maxLength={600}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={fieldError !== null}
            />
            {fieldError && <span className="text-danger">{reasonErrors[fieldError] ?? reasonErrors.NotBlank}</span>}
          </label>
        )}

        {action === "delete" && (
          <div className="flex flex-col gap-2 text-sm text-text">
            <p>
              {t("manage.dialog.deleteBody", {
                name: deck.name,
                status: deck.status === "published" ? t("manage.statusPublished") : t("manage.statusDraft"),
                cards: deck.cardCount,
              })}
            </p>
            {deck.status === "published" && <p className="text-warning">{t("manage.dialog.deletePublishedNote")}</p>}
            <p className="text-text-muted">{t("manage.dialog.retentionNote")}</p>
          </div>
        )}

        {action === "restore" && (
          <p className="text-sm text-text">{t("manage.dialog.restoreBody", { name: deck.name })}</p>
        )}
        {action === "restore" && newName !== null && (
          <TextField
            id="restore-name"
            label={t("manage.dialog.newName")}
            value={newName}
            maxLength={120}
            onChange={(e) => setNewName(e.target.value)}
            error={fieldError ? (nameErrors[fieldError] ?? nameErrors.NotBlank) : undefined}
          />
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {t("manage.form.cancel")}
          </Button>
          {blocked ? (
            onEdit && (
              <Button type="button" onClick={() => onEdit(deck.id)} leftIcon={<Icon name="pencil-line" />}>
                {t("manage.detail.edit")}
              </Button>
            )
          ) : (
            <Button
              type="button"
              variant={action === "delete" || action === "unpublish" ? "danger" : "primary"}
              isLoading={pending}
              disabled={action === "publish" && !detail.data}
              onClick={confirm}
            >
              {t(`manage.dialog.${action}Confirm`)}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
