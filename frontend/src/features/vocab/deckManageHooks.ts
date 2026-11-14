import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deckManageApi } from "./deckManageApi";
import type {
  CategoryOption,
  CreateDeckInput,
  DeckListFilter,
  ManageRole,
  UpdateDeckInput,
} from "./deckManageTypes";

export type { CategoryOption };

export const deckManageKeys = {
  all: ["vocab", "manage"] as const,
  teacher: (filter: DeckListFilter, page: number) => [...deckManageKeys.all, "teacher", filter, page] as const,
  admin: (filter: DeckListFilter, page: number) => [...deckManageKeys.all, "admin", filter, page] as const,
  categories: (role: ManageRole) => [...deckManageKeys.all, "categories", role] as const,
  detail: (role: ManageRole, deckId: string) => [...deckManageKeys.all, "detail", role, deckId] as const,
  cards: (role: ManageRole, deckId: string, groupId: string, q: string, page: number) =>
    [...deckManageKeys.all, "cards", role, deckId, groupId, q, page] as const,
};

/** Danh mục ít thay đổi (chỉ quản trị viên thêm, sửa tên) nên giữ 5 phút. */
const CATEGORIES_STALE_MS = 5 * 60 * 1000;

/** Không tự thử lại: lỗi hiện ngay kèm nút "Thử lại" (UC-BT-01 2b). */
export function useTeacherDecks(filter: DeckListFilter, page: number) {
  return useQuery({
    queryKey: deckManageKeys.teacher(filter, page),
    queryFn: () => deckManageApi.fetchTeacherDecks(filter, page),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useAdminDecks(filter: DeckListFilter, page: number) {
  return useQuery({
    queryKey: deckManageKeys.admin(filter, page),
    queryFn: () => deckManageApi.fetchAdminDecks(filter, page),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** Mọi danh mục (BR-BT-14), dùng chung cho ô lọc danh sách và biểu mẫu tạo bộ. */
export function useDeckCategories(role: ManageRole) {
  return useQuery({
    queryKey: deckManageKeys.categories(role),
    queryFn: () => deckManageApi.fetchCategories(role),
    staleTime: CATEGORIES_STALE_MS,
  });
}

/** Thông tin chung và nhóm thẻ của một bộ (UC-BT-04); lỗi 403/404 hiện ngay, không thử lại. */
export function useDeckDetail(role: ManageRole, deckId: string | undefined) {
  return useQuery({
    queryKey: deckManageKeys.detail(role, deckId ?? ""),
    queryFn: () => deckManageApi.fetchDeckDetail(role, deckId ?? ""),
    enabled: Boolean(deckId),
    retry: false,
  });
}

/** Thẻ của một nhóm, 20 thẻ mỗi trang (BR-BT-15). */
export function useGroupCards(role: ManageRole, deckId: string, groupId: string | null, q: string, page: number) {
  return useQuery({
    queryKey: deckManageKeys.cards(role, deckId, groupId ?? "", q.trim(), page),
    queryFn: () => deckManageApi.fetchGroupCards(role, deckId, groupId ?? "", q, page),
    enabled: Boolean(groupId),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** Sau mọi thao tác đổi bộ, tải lại danh sách và chi tiết (danh sách cũ có thể đã lệch, UC-BT-05 đến 08). */
function useDeckMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: deckManageKeys.all }),
  });
}

export function useUpdateTeacherDeck(deckId: string) {
  return useDeckMutation(({ input, image }: { input: UpdateDeckInput; image: File | null }) =>
    deckManageApi.updateTeacherDeck(deckId, input, image),
  );
}

export function usePublishDeck() {
  return useDeckMutation((deckId: string) => deckManageApi.publishDeck(deckId));
}

export function useUnpublishDeck(role: ManageRole) {
  return useDeckMutation(({ deckId, reason }: { deckId: string; reason: string | null }) =>
    deckManageApi.unpublishDeck(role, deckId, reason),
  );
}

export function useDeleteDeck() {
  return useDeckMutation((deckId: string) => deckManageApi.deleteDeck(deckId));
}

export function useRestoreDeck() {
  return useDeckMutation(({ deckId, name }: { deckId: string; name: string | null }) =>
    deckManageApi.restoreDeck(deckId, name),
  );
}

export function useCreateTeacherDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, image }: { input: CreateDeckInput; image: File | null }) =>
      deckManageApi.createTeacherDeck(input, image),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deckManageKeys.all }),
  });
}
