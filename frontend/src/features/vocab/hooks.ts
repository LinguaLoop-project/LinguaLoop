import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vocabApi } from "./api";

const NETWORK_MODE = "always" as const;

export const vocabKeys = {
  saved: ["vocab", "saved"] as const,
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
