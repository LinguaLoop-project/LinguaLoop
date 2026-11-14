// Trạng thái hiển thị của danh sách bộ thẻ (UC-BT-01: 2a danh sách trống, 6a không có kết quả, 2b lỗi tải).
import type { DeckListFilter, ManageRole } from "./deckManageTypes";

export const DEFAULT_DECK_LIST_FILTER: DeckListFilter = {
  q: "",
  categoryId: null,
  other: false,
  pro: false,
  status: "all",
  ownerId: null,
  system: false,
};

/** Có điều kiện tìm hoặc lọc nào khác mặc định không (từ khóa chỉ có khoảng trắng coi như trống). */
export function isDeckFilterActive(filter: DeckListFilter): boolean {
  return (
    filter.q.trim() !== "" ||
    filter.categoryId !== null ||
    filter.other ||
    filter.pro ||
    filter.status !== "all" ||
    filter.ownerId !== null ||
    filter.system
  );
}

/** "Xóa bộ lọc": quay về danh sách đầy đủ. */
export function clearDeckFilters(): DeckListFilter {
  return { ...DEFAULT_DECK_LIST_FILTER };
}

export type DeckListStateKind = "loading" | "error" | "empty" | "noResult" | "list";

export interface DeckListState<T> {
  kind: DeckListStateKind;
  /** Bộ để hiển thị; rỗng khi lỗi, không giữ danh sách cũ (AC-BT-64). */
  items: T[];
  /** Nút "Tạo bộ thẻ mới" ở danh sách trống, chỉ với giáo viên (AC-BT-05). */
  canCreate: boolean;
  canClearFilters: boolean;
  canRetry: boolean;
}

export interface DeckListInput<T> {
  role: ManageRole;
  filter: DeckListFilter;
  isLoading: boolean;
  isError: boolean;
  items: T[] | undefined;
}

export function deckListState<T>({ role, filter, isLoading, isError, items }: DeckListInput<T>): DeckListState<T> {
  const base = { items: [] as T[], canCreate: false, canClearFilters: false, canRetry: false };
  if (isError) return { ...base, kind: "error", canRetry: true };
  if (isLoading || items === undefined) return { ...base, kind: "loading" };
  if (items.length > 0) return { ...base, kind: "list", items };
  if (isDeckFilterActive(filter)) return { ...base, kind: "noResult", canClearFilters: true };
  return { ...base, kind: "empty", canCreate: role === "teacher" };
}
