import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { myDecksApi } from "./myDecksApi";
import { runQuickAdd, type QuickAddPlan } from "./quickAdd";

const NETWORK_MODE = "always" as const;

export const myDeckKeys = { all: ["vocab", "my-decks"] as const };

/** "Bộ của tôi"; số thẻ đến hạn đổi sau mỗi lượt ôn nên luôn tải lại khi mở tab. */
export const useMyDecks = (enabled = true) =>
  useQuery({ queryKey: myDeckKeys.all, queryFn: myDecksApi.list, enabled, networkMode: NETWORK_MODE, retry: 1 });

/**
 * Thêm, đổi tên hay xóa bộ đều làm đổi danh sách; xóa bộ còn đổi số thẻ đến hạn ở tab Ôn thẻ và tổng quan nên tải lại
 * cả các truy vấn từ vựng. Tải lại cả khi lỗi để bộ vừa bị xóa ở nơi khác biến mất.
 */
function useMyDeckMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    networkMode: NETWORK_MODE,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["vocab"] }),
  });
}

export const useCreateMyDeck = () => useMyDeckMutation((name: string) => myDecksApi.create(name));

export const useRenameMyDeck = () =>
  useMyDeckMutation(({ id, name }: { id: string; name: string }) => myDecksApi.rename(id, name));

export const useDeleteMyDeck = () => useMyDeckMutation((id: string) => myDecksApi.remove(id));

/** Thêm thẻ nhanh từ một nghĩa trong từ điển, tạo bộ hoặc nhóm nếu cần (UC-HT-10). */
export const useQuickAdd = () => useMyDeckMutation((plan: QuickAddPlan) => runQuickAdd(plan));
