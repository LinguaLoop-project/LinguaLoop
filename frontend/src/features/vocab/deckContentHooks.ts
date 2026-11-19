import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deckContentApi } from "./deckContentApi";
import type { AttachImageItem, CardInput } from "./deckContentTypes";
import { deckManageKeys } from "./deckManageHooks";
import type { ContentRole } from "./deckManageTypes";

/**
 * Mọi thay đổi nhóm thẻ và thẻ làm đổi số thẻ, thứ tự và ngày cập nhật của bộ (BR-NT-06), nên tải lại cả chi tiết bộ,
 * danh sách thẻ và danh sách bộ. Tải lại cả khi lỗi để nhóm hoặc thẻ vừa bị xóa ở nơi khác biến mất (luồng 2a, 3a).
 */
function useContentMutation<TVars, TResult>(
  mutationFn: (vars: TVars) => Promise<TResult>,
  role: ContentRole = "teacher",
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Thẻ của bộ cá nhân còn đổi số thẻ ở "Bộ của tôi", tổng quan và hàng đợi ôn (UC-HT-09): tải lại mọi truy vấn từ vựng.
    onSettled: () => queryClient.invalidateQueries({ queryKey: role === "learner" ? ["vocab"] : deckManageKeys.all }),
  });
}

export function useAddGroup(deckId: string, role: ContentRole = "teacher") {
  return useContentMutation((name: string) => deckContentApi.addGroup(deckId, name, role), role);
}

export function useRenameGroup(deckId: string, role: ContentRole = "teacher") {
  return useContentMutation(
    ({ groupId, name }: { groupId: string; name: string }) => deckContentApi.renameGroup(deckId, groupId, name, role),
    role,
  );
}

export function useDeleteGroup(deckId: string, role: ContentRole = "teacher") {
  return useContentMutation((groupId: string) => deckContentApi.deleteGroup(deckId, groupId, role), role);
}

export interface SaveCardVars {
  cardId: string | null;
  card: CardInput;
  /** Ảnh mới chọn; `null` = không đổi ảnh (hoặc bỏ ảnh nếu `removeImage`). */
  image: File | null;
  removeImage: boolean;
}

export function useSaveCard(deckId: string, groupId: string, role: ContentRole = "teacher") {
  return useContentMutation(
    ({ cardId, card, image, removeImage }: SaveCardVars) =>
      cardId
        ? deckContentApi.updateCard(deckId, groupId, cardId, card, image, removeImage, role)
        : deckContentApi.addCard(deckId, groupId, card, image, role),
    role,
  );
}

/** Gắn ảnh hàng loạt; tải lại thẻ sau khi gắn (kể cả khi chỉ gắn được một phần). */
export function useAttachImages(deckId: string, groupId: string) {
  return useContentMutation((items: AttachImageItem[]) => deckContentApi.attachImages(deckId, groupId, items));
}

export function useDeleteCard(deckId: string, groupId: string, role: ContentRole = "teacher") {
  return useContentMutation((cardId: string) => deckContentApi.deleteCard(deckId, groupId, cardId, role), role);
}

/** Kiểm tệp không đổi dữ liệu nên không tải lại gì. */
export function usePreviewImport(deckId: string, groupId: string, role: ContentRole = "teacher") {
  return useMutation({ mutationFn: (file: File) => deckContentApi.previewImport(deckId, groupId, file, role) });
}

export function useImportCards(deckId: string, groupId: string, role: ContentRole = "teacher") {
  return useContentMutation((file: File) => deckContentApi.importCards(deckId, groupId, file, role), role);
}
