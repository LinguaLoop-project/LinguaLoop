import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { toast } from "@/stores/toastStore";
import { conflictsOf, errorMessageKey, ownerIdsOf, selectionSummary } from "../../adminUsers";
import { useRecipients, useTeacherSummary, useTransferAll, useTransferSelected } from "../../hooks";
import type { AdminApiError, TransferConflict, TransferItem, TransferRecipient } from "../../types";

const TITLE_ID = "transfer-title";

/** Giao các mục đã chọn (UC-QT-06) hoặc toàn bộ nội dung thư viện của một giáo viên (UC-QT-07). */
export type TransferMode =
  | { kind: "selected"; items: TransferItem[] }
  | { kind: "all"; teacherId: string; teacherName: string };

export interface TransferDialogProps {
  mode: TransferMode;
  onClose: () => void;
  /** Giao thành công (để danh sách bỏ chọn các mục đã giao). */
  onDone?: () => void;
}

/**
 * Chọn giáo viên nhận (BR-QT-06) rồi xác nhận. Giao là toàn bộ hoặc không (BR-QT-07): giáo viên nhận không còn hợp lệ
 * hoặc trùng tên thì quay lại bước chọn giáo viên; nội dung đã thay đổi thì báo và làm mới; mất kết nối thì giữ hộp
 * xác nhận để thử lại.
 */
export default function TransferDialog({ mode, onClose, onDone }: Readonly<TransferDialogProps>) {
  const { t } = useTranslation("userAdmin");
  const summary = useTeacherSummary(mode.kind === "all" ? mode.teacherId : undefined);
  const selected = useTransferSelected();
  const all = useTransferAll();
  const [q, setQ] = useState("");
  const [recipient, setRecipient] = useState<TransferRecipient | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<TransferConflict[]>([]);
  const [failure, setFailure] = useState<string | null>(null);

  const exclude = mode.kind === "all" ? [mode.teacherId] : ownerIdsOf(mode.items);
  const noContent =
    mode.kind === "all" && summary.data !== undefined && summary.data.lessons + summary.data.decks === 0;
  const recipients = useRecipients(q, exclude, !noContent);
  const pending = selected.isPending || all.isPending;

  const counts =
    mode.kind === "selected"
      ? selectionSummary(mode.items)
      : { lessons: summary.data?.lessons ?? 0, decks: summary.data?.decks ?? 0, owners: [mode.teacherName] };

  const backToPick = (message: string | null, found: TransferConflict[] = []) => {
    setConfirming(false);
    setRecipient(null);
    setNotice(message);
    setConflicts(found);
  };

  const fail = (raw: unknown) => {
    const err = raw as unknown as AdminApiError;
    switch (err.code) {
      case "TRANSFER_RECIPIENT_INVALID":
        void recipients.refetch();
        backToPick("errors.TRANSFER_RECIPIENT_INVALID");
        return;
      case "TRANSFER_NAME_CONFLICT":
        backToPick(null, conflictsOf(err));
        return;
      case "TRANSFER_CONTENT_CHANGED":
        if (mode.kind === "all") {
          void summary.refetch();
          backToPick("errors.TRANSFER_CONTENT_CHANGED_ALL");
        } else {
          toast(t("errors.TRANSFER_CONTENT_CHANGED"), { icon: "circle-alert" });
          onDone?.();
          onClose();
        }
        return;
      case "TRANSFER_NO_CONTENT":
        void summary.refetch();
        backToPick(null);
        return;
      default:
        setFailure(errorMessageKey(err, "transfer.failed"));
    }
  };

  const submit = () => {
    if (!recipient) return;
    setFailure(null);
    const callbacks = {
      onSuccess: (result: { lessons: number; decks: number; recipientName: string }) => {
        toast(t("transfer.done", { lessons: result.lessons, decks: result.decks, name: result.recipientName }), {
          icon: "circle-check",
        });
        onDone?.();
        onClose();
      },
      onError: fail,
    };
    if (mode.kind === "selected") {
      selected.mutate(
        {
          recipientId: recipient.id,
          items: mode.items.map((item) => ({ type: item.type, id: item.id, ownerId: item.ownerId })),
        },
        callbacks,
      );
    } else if (summary.data) {
      all.mutate(
        { teacherId: mode.teacherId, recipientId: recipient.id, lessons: summary.data.lessons, decks: summary.data.decks },
        callbacks,
      );
    }
  };

  const title = mode.kind === "all" ? t("transfer.allTitle") : t("transfer.assignSelected");
  const recipientList = recipients.data ?? [];
  const noRecipients = !recipients.isLoading && recipientList.length === 0 && !q.trim();

  let body;
  if (mode.kind === "all" && summary.isLoading) {
    body = <Skeleton className="h-32 w-full" />;
  } else if (mode.kind === "all" && summary.isError) {
    body = <FormAlert variant="danger">{t(errorMessageKey(summary.error as unknown as AdminApiError, "transfer.failed"))}</FormAlert>;
  } else if (noContent) {
    body = <FormAlert variant="info">{t("transfer.noContent")}</FormAlert>;
  } else if (confirming && recipient) {
    body = (
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-text-muted">{t("transfer.colName")}</dt>
        <dd className="font-semibold text-text">{t("transfer.summary", { lessons: counts.lessons, decks: counts.decks })}</dd>
        <dt className="text-text-muted">{t("transfer.from")}</dt>
        <dd className="text-text">{counts.owners.map((name) => name ?? t("system")).join(", ")}</dd>
        <dt className="text-text-muted">{t("transfer.to")}</dt>
        <dd className="text-text">
          {recipient.displayName} · {recipient.email}
        </dd>
      </dl>
    );
  } else {
    body = (
      <div className="flex flex-col gap-3">
        {mode.kind === "all" && summary.data && (
          <div className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm">
            <p className="font-semibold text-text">
              {t("transfer.allSummary", {
                lessons: summary.data.lessons,
                decks: summary.data.decks,
                reports: summary.data.openReports,
              })}
            </p>
            {summary.data.draftLessons + summary.data.draftDecks > 0 && (
              <p className="text-text-muted">
                {t("transfer.allDrafts", { lessons: summary.data.draftLessons, decks: summary.data.draftDecks })}
              </p>
            )}
          </div>
        )}
        {mode.kind === "selected" && (
          <p className="text-sm text-text">{t("transfer.summary", { lessons: counts.lessons, decks: counts.decks })}</p>
        )}
        {notice && <FormAlert variant="warning">{t(notice)}</FormAlert>}
        {conflicts.length > 0 && (
          <FormAlert variant="warning">
            <p>{t("transfer.conflicts")}</p>
            <ul className="mt-1 list-disc pl-5">
              {conflicts.map((c) => (
                <li key={`${c.type}:${c.id}`}>
                  {t(`types.${c.type}`)}: {c.name}
                </li>
              ))}
            </ul>
          </FormAlert>
        )}
        {noRecipients ? (
          <FormAlert variant="info">
            <p className="font-semibold">{t("transfer.noRecipients")}</p>
            <p>{t("transfer.noRecipientsHint")}</p>
          </FormAlert>
        ) : (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-text">{t("transfer.chooseRecipient")}</legend>
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder={t("transfer.recipientSearch")}
              ariaLabel={t("transfer.recipientSearch")}
            />
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {recipients.isLoading && <Skeleton className="h-20 w-full" />}
              {!recipients.isLoading && recipientList.length === 0 && (
                <li className="px-1 py-2 text-sm text-text-muted">{t("transfer.noRecipientMatch")}</li>
              )}
              {recipientList.map((r) => (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                    <input
                      type="radio"
                      name="recipient"
                      checked={recipient?.id === r.id}
                      onChange={() => setRecipient(r)}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold text-text">{r.displayName}</span>
                      <span className="truncate text-xs text-text-muted">{r.email}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}
      </div>
    );
  }

  const canPick = !noContent && !(mode.kind === "all" && !summary.data);

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID} wide>
      <div className="flex flex-col gap-4">
        <h2 id={TITLE_ID} className="text-lg font-bold text-text">
          {confirming ? t("transfer.confirmTitle") : title}
          {mode.kind === "all" && <span className="ml-2 font-normal text-text-muted">· {mode.teacherName}</span>}
        </h2>
        {failure && <FormAlert variant="danger">{t(failure)}</FormAlert>}
        {body}
        <div className="flex flex-wrap justify-end gap-2">
          {confirming && (
            <Button type="button" variant="ghost" onClick={() => backToPick(null)} disabled={pending}>
              {t("transfer.changeRecipient")}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {canPick ? t("cancel") : t("close")}
          </Button>
          {canPick && !confirming && (
            <Button
              type="button"
              disabled={!recipient}
              rightIcon={<Icon name="arrow-right" />}
              onClick={() => {
                setFailure(null);
                setConfirming(true);
              }}
            >
              {t("transfer.continue")}
            </Button>
          )}
          {confirming && (
            <Button type="button" isLoading={pending} leftIcon={<Icon name="arrow-left-right" />} onClick={submit}>
              {mode.kind === "all" ? t("transfer.allConfirm") : t("transfer.confirm")}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
