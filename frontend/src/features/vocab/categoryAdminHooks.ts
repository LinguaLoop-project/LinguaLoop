import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryAdminApi } from "./categoryAdminApi";
import { deckManageKeys } from "./deckManageHooks";

export const ADMIN_CATEGORIES_KEY = ["admin", "categories"] as const;

/** Danh sách danh mục theo từ khóa (UC-CD-04); giữ danh sách cũ trong lúc tải kết quả tìm mới. */
export function useAdminCategories(q: string) {
  return useQuery({
    queryKey: [...ADMIN_CATEGORIES_KEY, q.trim()],
    queryFn: () => categoryAdminApi.list(q),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** Danh mục đổi thì đọc lại cả danh sách quản trị lẫn danh mục để lọc và chọn khi soạn bộ (BR-BT-14). */
function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
    void queryClient.invalidateQueries({ queryKey: [...deckManageKeys.all, "categories"] });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({ mutationFn: (name: string) => categoryAdminApi.create(name), onSuccess: invalidate });
}

export function useRenameCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => categoryAdminApi.rename(id, name),
    onSuccess: invalidate,
  });
}
