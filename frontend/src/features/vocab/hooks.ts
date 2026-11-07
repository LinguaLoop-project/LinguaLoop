import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { vocabApi } from "./api";

const NETWORK_MODE = "always" as const;

export const vocabKeys = {
  saved: ["vocab", "saved"] as const,
  decks: ["vocab", "decks"] as const,
  deck: (slug: string) => ["vocab", "deck", slug] as const,
  part: (slug: string, part: number) => ["vocab", "part", slug, part] as const,
};

/** Từ đã lưu của người học; hộp tra từ và trang Từ & câu đã lưu dùng chung một bản. */
export const useSavedWords = (enabled = true) =>
  useQuery({
    queryKey: vocabKeys.saved,
    queryFn: vocabApi.listSaved,
    enabled,
    networkMode: NETWORK_MODE,
    staleTime: 60_000,
  });

/** Bộ hệ thống kèm tiến độ; tiến độ đổi sau mỗi lượt học nên luôn tải lại khi mở trang. */
export const useDecks = () =>
  useQuery({ queryKey: vocabKeys.decks, queryFn: vocabApi.listDecks, networkMode: NETWORK_MODE });

/** Chi tiết một bộ; 404 khi bộ không tồn tại nên không thử lại. */
export const useDeck = (slug: string | undefined) =>
  useQuery({
    queryKey: vocabKeys.deck(slug ?? ""),
    queryFn: () => vocabApi.getDeck(slug!),
    enabled: !!slug,
    networkMode: NETWORK_MODE,
    retry: (count, error) => !(isAxiosError(error) && error.response?.status === 404) && count < 2,
  });

const isStatus = (error: unknown, ...codes: number[]) =>
  isAxiosError(error) && error.response !== undefined && codes.includes(error.response.status);

/** Thẻ của một phần; luôn tải mới khi mở vì trạng thái thẻ quyết định lượt học đầu tiên. 403 và 404 không thử lại. */
export const usePart = (slug: string | undefined, part: number) =>
  useQuery({
    queryKey: vocabKeys.part(slug ?? "", part),
    queryFn: () => vocabApi.getPart(slug!, part),
    enabled: !!slug && Number.isInteger(part) && part >= 1,
    networkMode: NETWORK_MODE,
    gcTime: 0,
    retry: (count, error) => !isStatus(error, 403, 404) && count < 2,
  });

/** Lưu một nghĩa; làm mới danh sách khi xong. */
export const useSaveWord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: vocabApi.saveWord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vocabKeys.saved }),
  });
};

/** Bỏ lưu theo id từ đã lưu; làm mới danh sách khi xong. */
export const useUnsaveWord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: vocabApi.unsaveWord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vocabKeys.saved }),
  });
};
