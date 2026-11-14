import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deckContentApi } from "./deckContentApi";
import type { AttachImageItem, CardInput } from "./deckContentTypes";
import { deckManageKeys } from "./deckManageHooks";

/**
 * Mọi thay đổi nhóm thẻ và thẻ làm đổi số thẻ, thứ tự và ngày cập nhật của bộ (BR-NT-06), nên tải lại cả chi tiết bộ,
 * danh sách thẻ và danh sách bộ. Tải lại cả khi lỗi để nhóm hoặc thẻ vừa bị xóa ở nơi khác biến mất (luồng 2a, 3a).
 */
function useContentMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: deckManageKeys.all }),
  });
}

export function useAddGroup(deckId: string) {
  return useContentMutation((name: string) => deckContentApi.addGroup(deckId, name));
}

export function useRenameGroup(deckId: string) {
  return useContentMutation(({ groupId, name }: { groupId: string; name: string }) =>
    deckContentApi.renameGroup(deckId, groupId, name),
  );
}

export function useDeleteGroup(deckId: string) {
  return useContentMutation((groupId: string) => deckContentApi.deleteGroup(deckId, groupId));
}

export interface SaveCardVars {
  cardId: string | null;
  card: CardInput;
  /** Ảnh mới chọn; `null` = không đổi ảnh (hoặc bỏ ảnh nếu `removeImage`). */
  image: File | null;
  removeImage: boolean;
}

export function useSaveCard(deckId: string, groupId: string) {
  return useContentMutation(({ cardId, card, image, removeImage }: SaveCardVars) =>
    cardId
      ? deckContentApi.updateCard(deckId, groupId, cardId, card, image, removeImage)
      : deckContentApi.addCard(deckId, groupId, card, image),
  );
}

/** Gắn ảnh hàng loạt; tải lại thẻ sau khi gắn (kể cả khi chỉ gắn được một phần). */
export function useAttachImages(deckId: string, groupId: string) {
  return useContentMutation((items: AttachImageItem[]) => deckContentApi.attachImages(deckId, groupId, items));
}

export function useDeleteCard(deckId: string, groupId: string) {
  return useContentMutation((cardId: string) => deckContentApi.deleteCard(deckId, groupId, cardId));
}

/** Kiểm tệp không đổi dữ liệu nên không tải lại gì. */
export function usePreviewImport(deckId: string, groupId: string) {
  return useMutation({ mutationFn: (file: File) => deckContentApi.previewImport(deckId, groupId, file) });
}

export function useImportCards(deckId: string, groupId: string) {
  return useContentMutation((file: File) => deckContentApi.importCards(deckId, groupId, file));
}
