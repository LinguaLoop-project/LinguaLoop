import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import DeckActionDialog from "../../components/manage/DeckActionDialog";
import ManageDeckList from "../../components/manage/ManageDeckList";
import type { LifecycleAction } from "../../deckLifecycle";
import { DEFAULT_DECK_LIST_FILTER } from "../../deckListState";
import { useDeckCategories, useTeacherDecks } from "../../deckManageHooks";
import { TEACHER_DECKS_PATH } from "../../deckManagePaths";
import type { DeckApiError, DeckListFilter, ManageDeckItem } from "../../deckManageTypes";

/**
 * Danh sách bộ thẻ của giáo viên (UC-BT-01). Đổi bộ lọc thì quay về trang đầu. Xuất bản, gỡ xuất bản, xóa, khôi phục
 * mở hộp xác nhận ngay trên danh sách (UC-BT-05 đến 08).
 */
export default function TeacherDeckListPage() {
  const { t } = useTranslation("vocab");
  const navigate = useNavigate();
  const [filter, setFilter] = useState<DeckListFilter>(DEFAULT_DECK_LIST_FILTER);
  const [page, setPage] = useState(0);
  const query = useTeacherDecks(filter, page);
  const categories = useDeckCategories("teacher");
  const [pending, setPending] = useState<{ action: LifecycleAction; deck: ManageDeckItem } | null>(null);
  const goCreate = () => navigate(`${TEACHER_DECKS_PATH}/new`);
  /** Trang bộ: xem và sửa tại chỗ (UC-BT-03, 04). */
  const goDeck = (deckId: string) => navigate(`${TEACHER_DECKS_PATH}/${deckId}`);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">{t("manage.title")}</h1>
        <Button onClick={goCreate} leftIcon={<Icon name="plus" />}>
          {t("manage.create")}
        </Button>
      </header>
      <ManageDeckList
        role="teacher"
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
        onCreate={goCreate}
        onOpen={(deck) => goDeck(deck.id)}
        onAction={(action, deck) => setPending({ action, deck })}
      />
      {pending && (
        <DeckActionDialog
          role="teacher"
          action={pending.action}
          deck={pending.deck}
          onClose={() => setPending(null)}
          onEdit={goDeck}
        />
      )}
    </main>
  );
}
