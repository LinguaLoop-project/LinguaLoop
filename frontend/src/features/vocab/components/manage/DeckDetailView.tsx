import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import Skeleton from "@/components/common/Skeleton";
import { toast } from "@/stores/toastStore";
import type { ContentFailure } from "../../deckContentForm";
import type { LifecycleAction } from "../../deckLifecycle";
import { useDeckDetail, useGroupCards } from "../../deckManageHooks";
import { ADMIN_DECKS_PATH, TEACHER_DECKS_PATH } from "../../deckManagePaths";
import type { DeckApiError, DeckCard, DeckGroup, ManageRole } from "../../deckManageTypes";
import CardDialog from "./CardDialog";
import CardRow from "./CardRow";
import CardImagesDialog from "./CardImagesDialog";
import CardImportDialog from "./CardImportDialog";
import ContentDeleteDialog, { type DeleteTarget } from "./ContentDeleteDialog";
import DeckActionDialog from "./DeckActionDialog";
import GroupDialog from "./GroupDialog";
import GroupList from "./GroupList";
import DeckInfoEditor from "./DeckInfoEditor";
import DeckMoreMenu from "./DeckMoreMenu";
import { MetaChip, StatusBadge } from "./DeckBits";

export interface DeckDetailViewProps {
  role: ManageRole;
  deckId: string;
}

function formatDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(language === "en" ? "en-GB" : "vi-VN");
}

/**
 * Trang của một bộ thẻ: xem chi tiết (UC-BT-04) và, với giáo viên, sửa thông tin ngay tại chỗ (UC-BT-03). Gồm thông tin
 * chung, nhóm thẻ, thẻ của nhóm đang chọn (20 thẻ mỗi trang, tìm theo từ vựng). Giáo viên xuất bản, gỡ, xóa ngay trên
 * trang; quản trị viên chỉ xem và gỡ xuất bản. Xem không ghi tiến độ học (BR-BT-11).
 */
export default function DeckDetailView({ role, deckId }: DeckDetailViewProps) {
  const { t, i18n } = useTranslation("vocab");
  const navigate = useNavigate();
  const listPath = role === "teacher" ? TEACHER_DECKS_PATH : ADMIN_DECKS_PATH;
  const detail = useDeckDetail(role, deckId);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<LifecycleAction | null>(null);
  // Hộp nhóm thẻ, thẻ, xóa, nhập tệp (UC-NT-01 đến 07); "new" = thêm nhóm mới.
  const [groupDialog, setGroupDialog] = useState<DeckGroup | "new" | null>(null);
  const [cardDialog, setCardDialog] = useState<{ card: DeckCard | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const deck = detail.data;
  const activeGroup = groupId ?? deck?.groups[0]?.id ?? null;
  const cards = useGroupCards(role, deckId, activeGroup, q, page);
  const error = detail.isError ? (detail.error as unknown as DeckApiError) : null;

  // Bộ đã bị xóa (hoặc vừa bị gỡ với quản trị viên): báo không tìm thấy và về danh sách (UC-BT-04 1b, AC-BT-55).
  useEffect(() => {
    if (error?.kind === "notFound") {
      toast(t("manage.feedback.notFound"), { icon: "circle-alert" });
      navigate(listPath, { replace: true });
    }
  }, [error?.kind, listPath, navigate, t]);

  const goneToList = () => {
    toast(t("manage.feedback.notFound"), { icon: "circle-alert" });
    navigate(listPath, { replace: true });
  };
  const selectGroup = (id: string) => {
    setGroupId(id);
    setQ("");
    setPage(0);
  };

  /** Lỗi làm thao tác trên nhóm thẻ, thẻ không còn ý nghĩa; danh sách đã được tải lại sau mỗi thao tác. */
  const onContentFailure = (failure: ContentFailure) => {
    switch (failure.kind) {
      case "deckGone":
        goneToList();
        return;
      case "groupGone":
        setGroupId(null);
        toast(t("content.feedback.groupGone"), { icon: "circle-alert" });
        return;
      case "cardGone":
        toast(t("content.feedback.cardGone"), { icon: "circle-alert" });
        return;
      case "forbidden":
        toast(t("content.feedback.forbidden"), { icon: "circle-alert" });
        return;
      case "mustStayPublishable":
        toast(t(`content.feedback.${failure.reason}`), { icon: "circle-alert" });
        return;
      default:
        toast(t("content.feedback.saveFailed"), { icon: "circle-alert" });
    }
  };

  if (detail.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (error?.kind === "forbidden") {
    return (
      <EmptyState
        icon="lock"
        title={t("manage.detail.forbidden")}
        actionText={t("manage.detail.back")}
        onAction={() => navigate(listPath)}
      />
    );
  }
  if (error || !deck) {
    return <ErrorState kind={error?.kind === "network" ? "network" : "server"} onRetry={() => void detail.refetch()} />;
  }

  const isTeacher = role === "teacher";
  const published = deck.status === "published";
  // Giáo viên thấy nhóm thẻ cả khi nhóm chưa có thẻ để thêm thẻ vào; quản trị viên chỉ xem bộ đã có thẻ.
  const showGroups = isTeacher ? deck.groups.length > 0 : deck.groups.length > 0 && deck.cardCount > 0;
  const group = deck.groups.find((g) => g.id === activeGroup) ?? null;
  const posLabel = (pos: string | null) => (pos ? t(`content.pos.${pos}`, { defaultValue: pos }) : null);

  // Bộ Đã xuất bản phải luôn đủ điều kiện xuất bản (BR-NT-05): chặn sớm, máy chủ vẫn kiểm lại.
  const openAddGroup = () => {
    if (published) toast(t("content.feedback.EMPTY_GROUP"), { icon: "circle-alert" });
    else setGroupDialog("new");
  };
  const openDeleteGroup = (target: DeckGroup) => {
    if (published && deck.groups.length <= 1) toast(t("content.feedback.LAST_GROUP"), { icon: "circle-alert" });
    else setDeleteTarget({ kind: "group", group: target });
  };
  const openDeleteCard = (target: DeckGroup, card: DeckCard) => {
    if (published && target.cardCount <= 1) toast(t("content.feedback.LAST_CARD"), { icon: "circle-alert" });
    else setDeleteTarget({ kind: "card", group: target, card });
  };

  return (
    <section className="flex flex-col gap-5">
      <Button
        variant="text"
        className="self-start"
        leftIcon={<Icon name="chevron-left" />}
        onClick={() => navigate(listPath)}
      >
        {t("manage.detail.back")}
      </Button>

      <header className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-surface p-5">
        {role === "teacher" ? (
          <DeckInfoEditor key={deck.updatedAt} deck={deck} onGone={goneToList} />
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
            <div className="grid h-28 w-36 place-items-center overflow-hidden rounded-xl border border-border bg-[linear-gradient(135deg,var(--fn-vocab-soft),var(--primary-soft))]">
              {deck.imageUrl ? (
                <img src={deck.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon name="gallery-vertical-end" className="text-4xl text-fn-vocab" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <h1 className="text-2xl font-bold text-text">{deck.name}</h1>
              <div className="flex flex-wrap gap-1.5 text-xs text-text-muted">
                <MetaChip icon="folders">{deck.categoryName ?? t("manage.otherCategory")}</MetaChip>
                <MetaChip icon="user">{deck.ownerName ?? t("manage.system")}</MetaChip>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {deck.pro && (
              <Badge variant="pro">
                <Icon name="crown" />
                {t("deck.pro")}
              </Badge>
            )}
            <StatusBadge
              status={published ? "published" : "draft"}
              label={published ? t("manage.statusPublished") : t("manage.statusDraft")}
            />
          </div>
          <div className="flex items-center gap-2">
            {role === "teacher" && deck.status === "draft" && (
              <Button leftIcon={<Icon name="send" />} onClick={() => setAction("publish")}>
                {t("manage.action.publish")}
              </Button>
            )}
            {deck.status === "published" && (
              <Button variant="secondary" leftIcon={<Icon name="eye-off" />} onClick={() => setAction("unpublish")}>
                {t("manage.action.unpublish")}
              </Button>
            )}
            {role === "teacher" && <DeckMoreMenu onDelete={() => setAction("delete")} />}
          </div>
          <div className="flex flex-wrap justify-end gap-1.5 text-xs text-text-muted">
            <MetaChip icon="layers">{t("manage.groupCount", { count: deck.groups.length })}</MetaChip>
            <MetaChip icon="sticky-note">{t("manage.cardCount", { count: deck.cardCount })}</MetaChip>
            <MetaChip icon="clock">{t("manage.updatedOn", { date: formatDate(deck.updatedAt, i18n.language) })}</MetaChip>
          </div>
        </div>
      </header>

      {role === "teacher" && deck.status === "draft" && deck.unpublishReason && (
        <FormAlert variant="warning">{t("manage.unpublishedByAdmin", { reason: deck.unpublishReason })}</FormAlert>
      )}

      {isTeacher && published && <FormAlert variant="info">{t("content.publishedHint")}</FormAlert>}

      {!showGroups && isTeacher && (
        <EmptyState
          icon="layers"
          title={t("content.emptyDeck")}
          description={t("content.emptyDeckHint")}
          actionText={t("content.addGroup")}
          onAction={openAddGroup}
        />
      )}
      {!showGroups && !isTeacher && <EmptyState title={t("manage.detail.noCards")} />}
      {showGroups && (
        <div className="grid items-start gap-4 md:grid-cols-[280px_1fr]">
          <GroupList
            groups={deck.groups}
            activeId={activeGroup}
            onSelect={selectGroup}
            onAdd={isTeacher ? openAddGroup : undefined}
          />
          <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4">
            {isTeacher && group && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-text">{group.name}</h2>
                  <p className="text-xs text-text-muted">{t("content.groupCards", { count: group.cardCount })}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" leftIcon={<Icon name="plus" />} onClick={() => setCardDialog({ card: null })}>
                    {t("content.addCard")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Icon name="file-spreadsheet" />}
                    onClick={() => setImportOpen(true)}
                  >
                    {t("content.importCards")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Icon name="image-plus" />}
                    disabled={group.cardCount === 0}
                    title={group.cardCount === 0 ? t("content.images.needCards") : undefined}
                    onClick={() => setImagesOpen(true)}
                  >
                    {t("content.attachImages")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    iconOnly
                    aria-label={t("content.renameGroup")}
                    title={t("content.renameGroup")}
                    onClick={() => setGroupDialog(group)}
                  >
                    <Icon name="pencil-line" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    iconOnly
                    aria-label={t("content.deleteGroup")}
                    title={t("content.deleteGroup")}
                    onClick={() => openDeleteGroup(group)}
                  >
                    <Icon name="trash-2" />
                  </Button>
                </div>
              </div>
            )}
            {(q || !group || group.cardCount > 0) && (
              <SearchInput
                value={q}
                onChange={(value) => {
                  setQ(value);
                  setPage(0);
                }}
                placeholder={t("manage.detail.searchCards")}
                ariaLabel={t("manage.detail.searchCards")}
              />
            )}
            {cards.isLoading && <Skeleton className="h-40 w-full" />}
            {cards.isError && <ErrorState kind="server" onRetry={() => void cards.refetch()} />}
            {cards.data && cards.data.items.length === 0 && isTeacher && !q && (
              <EmptyState
                icon="sticky-note"
                title={t("content.emptyGroup")}
                description={t("content.emptyGroupHint")}
                actionText={t("content.addCard")}
                onAction={() => setCardDialog({ card: null })}
              />
            )}
            {cards.data && cards.data.items.length === 0 && (!isTeacher || q) && (
              <EmptyState
                title={t("manage.detail.noCardMatch")}
                actionText={q ? t("manage.detail.clearSearch") : undefined}
                onAction={q ? () => setQ("") : undefined}
              />
            )}
            {cards.data && cards.data.items.length > 0 && (
              <ul className="flex flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border bg-bg-elevated [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin] md:max-h-[calc(100vh-20rem)]">
                {cards.data.items.map((card) => (
                  <CardRow
                    key={card.id}
                    card={card}
                    posLabel={posLabel(card.pos)}
                    actions={
                      isTeacher && group
                        ? {
                            editLabel: t("content.editCard"),
                            deleteLabel: t("content.deleteCard"),
                            onEdit: () => setCardDialog({ card }),
                            onDelete: () => openDeleteCard(group, card),
                          }
                        : undefined
                    }
                  />
                ))}
              </ul>
            )}
            {cards.data && cards.data.totalPages > 1 && (
              <nav className="flex items-center justify-center gap-3" aria-label={t("manage.pagination")}>
                <Button
                  size="sm"
                  variant="secondary"
                  iconOnly
                  aria-label={t("manage.prev")}
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <Icon name="chevron-left" />
                </Button>
                <span className="text-sm text-text-muted">
                  {page + 1} / {cards.data.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  iconOnly
                  aria-label={t("manage.next")}
                  disabled={page + 1 >= cards.data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <Icon name="chevron-right" />
                </Button>
              </nav>
            )}
          </div>
        </div>
      )}

      {groupDialog && (
        <GroupDialog
          deckId={deckId}
          group={groupDialog === "new" ? null : groupDialog}
          onClose={() => setGroupDialog(null)}
          onFailure={onContentFailure}
          onSaved={(saved) => {
            if (groupDialog === "new") selectGroup(saved.id);
          }}
        />
      )}
      {cardDialog && group && (
        <CardDialog
          deckId={deckId}
          groupId={group.id}
          groupName={group.name}
          card={cardDialog.card}
          onClose={() => setCardDialog(null)}
          onFailure={onContentFailure}
        />
      )}
      {imagesOpen && group && (
        <CardImagesDialog
          deckId={deckId}
          group={group}
          onClose={() => setImagesOpen(false)}
          onFailure={onContentFailure}
        />
      )}
      {importOpen && group && (
        <CardImportDialog
          deckId={deckId}
          group={group}
          onClose={() => setImportOpen(false)}
          onFailure={onContentFailure}
        />
      )}
      {deleteTarget && (
        <ContentDeleteDialog
          deckId={deckId}
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onFailure={onContentFailure}
          onDeleted={() => {
            if (deleteTarget.kind === "group" && deleteTarget.group.id === activeGroup) setGroupId(null);
          }}
        />
      )}

      {action && (
        <DeckActionDialog
          role={role}
          action={action}
          deck={deck}
          onClose={() => setAction(null)}
          onEdit={() => setAction(null)}
          onDone={(done) => {
            if (done === "delete" || (role === "admin" && done === "unpublish")) navigate(listPath);
          }}
        />
      )}
    </section>
  );
}
