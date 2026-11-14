import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DeckActionDialog from "../../components/manage/DeckActionDialog";
import ManageDeckList from "../../components/manage/ManageDeckList";
import { DEFAULT_DECK_LIST_FILTER } from "../../deckListState";
import { useAdminDecks, useDeckCategories, type CategoryOption } from "../../deckManageHooks";
import { ADMIN_DECKS_PATH } from "../../deckManagePaths";
import type { AdminDeckItem, DeckApiError, DeckListFilter, ManageDeckItem } from "../../deckManageTypes";

/** Giáo viên chủ bộ có trong các bộ đã tải, để chọn lọc khi chưa có API danh sách giáo viên. */
function ownerOptions(items: AdminDeckItem[]): CategoryOption[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    if (item.ownerId && item.ownerName) seen.set(item.ownerId, item.ownerName);
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

/** Danh sách bộ thẻ Đã xuất bản cho quản trị viên (UC-BT-01): chỉ Xem chi tiết và Gỡ xuất bản. */
export default function AdminDeckListPage() {
  const { t } = useTranslation("vocab");
  const navigate = useNavigate();
  const [filter, setFilter] = useState<DeckListFilter>(DEFAULT_DECK_LIST_FILTER);
  const [page, setPage] = useState(0);
  const query = useAdminDecks(filter, page);
  const items = query.data?.items ?? [];
  const categories = useDeckCategories("admin");
  const [pending, setPending] = useState<ManageDeckItem | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <h1 className="text-2xl font-bold text-text">{t("manage.title")}</h1>
      <ManageDeckList
        role="admin"
        filter={filter}
        onFilterChange={(next) => {
          setFilter(next);
          setPage(0);
        }}
        page={page}
        onPageChange={setPage}
        data={query.data}
        isLoading={query.isLoading}
        error={query.isError ? (query.error as unknown as DeckApiError) : null}
        onRetry={() => void query.refetch()}
        categories={categories.data ?? []}
        owners={ownerOptions(items)}
        onOpen={(deck) => navigate(`${ADMIN_DECKS_PATH}/${deck.id}`)}
        onAction={(action, deck) => {
          if (action === "unpublish") setPending(deck);
        }}
      />
      {pending && (
        <DeckActionDialog role="admin" action="unpublish" deck={pending} onClose={() => setPending(null)} />
      )}
    </main>
  );
}
