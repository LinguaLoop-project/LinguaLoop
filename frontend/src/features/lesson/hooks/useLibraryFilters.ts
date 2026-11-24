import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { buildLibraryParams, parseLibraryFilters, parsePaging } from "../libraryFilters";
import { DEFAULT_FILTERS, type LibraryFilters } from "../utils";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Bộ lọc và phân trang của thư viện bài và trang chủ đề, lưu trên địa chỉ trang (`?q=&level=&page=`) để chia sẻ và dùng
 * nút Lùi. Ô tìm kiếm có bản nháp riêng, chỉ ghi lên địa chỉ khi ngừng gõ.
 *
 * @param withTopic true ở thư viện (chủ đề là một bộ lọc), false ở trang chủ đề (chủ đề nằm trên đường dẫn)
 */
export function useLibraryFilters({ withTopic }: { withTopic: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseLibraryFilters(searchParams, withTopic), [searchParams, withTopic]);
  const { page, pageSize } = useMemo(() => parsePaging(searchParams), [searchParams]);

  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  // Địa chỉ đổi từ ngoài (nút Lùi, Đặt lại): ô gõ đi theo địa chỉ. Đặt state ngay khi render, không qua effect.
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearchDraft(filters.search);
  }
  const debouncedSearch = useDebounce(searchDraft, SEARCH_DEBOUNCE_MS);

  const updateParams = useCallback(
    (next: LibraryFilters, nextPage = 0, nextSize = pageSize) => {
      setSearchParams(buildLibraryParams(next, nextPage, nextSize, withTopic), { replace: true });
    },
    [setSearchParams, pageSize, withTopic],
  );

  useEffect(() => {
    // Chỉ ghi khi ô gõ đã ổn định: ngay sau "Đặt lại" bản debounce còn là giá trị cũ và không được ghi đè lại địa chỉ.
    if (debouncedSearch !== searchDraft) return;
    if (debouncedSearch.trim() !== filters.search.trim()) {
      updateParams({ ...filters, search: debouncedSearch }, 0);
    }
  }, [debouncedSearch, searchDraft, filters, updateParams]);

  const handleFiltersChange = (next: LibraryFilters) => {
    if (next.search !== searchDraft) {
      setSearchDraft(next.search);
      return;
    }
    updateParams(next, 0);
  };

  const resetFilters = () => {
    setSearchDraft("");
    updateParams(DEFAULT_FILTERS, 0);
  };

  const setPage = useCallback((nextPage: number) => updateParams(filters, nextPage), [updateParams, filters]);
  const handlePageSizeChange = (nextSize: number) => updateParams(filters, 0, nextSize);

  return {
    filters,
    /** Bộ lọc kèm chữ đang gõ, để thanh lọc hiện đúng ô tìm kiếm. */
    effectiveFilters: { ...filters, search: searchDraft } satisfies LibraryFilters,
    page,
    pageSize,
    updateParams,
    setPage,
    handleFiltersChange,
    resetFilters,
    handlePageSizeChange,
  };
}

/** Link có `?page=` vượt số trang thật (bài bị gỡ, bộ lọc đổi): tự lùi về trang cuối. */
export function usePageClamp(page: number, totalPages: number, enabled: boolean, goTo: (page: number) => void) {
  useEffect(() => {
    if (enabled && totalPages > 0 && page >= totalPages) goTo(totalPages - 1);
  }, [enabled, page, totalPages, goTo]);
}
