import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { dictionaryApi } from "./api";

export const dictionaryKeys = {
  word: (word: string) => ["dictionary", "word", word] as const,
  search: (query: string) => ["dictionary", "search", query] as const,
};

/** Từ không có trong từ điển (404), khác với lỗi mạng hay lỗi máy chủ. */
export const isWordNotFound = (error: unknown) => isAxiosError(error) && error.response?.status === 404;

/** Tra một từ đã chuẩn hóa. Nội dung từ điển gần như không đổi nên giữ cache đến hết phiên. */
export const useWordLookup = (word: string | null) =>
  useQuery({
    queryKey: dictionaryKeys.word(word ?? ""),
    queryFn: () => dictionaryApi.lookup(word!),
    enabled: !!word,
    staleTime: Infinity,
  });

/** Tìm trong kho từ điển; giữ kết quả cũ trong lúc gõ để danh sách không nháy. */
export const useDictionarySearch = (query: string) =>
  useQuery({
    queryKey: dictionaryKeys.search(query),
    queryFn: () => dictionaryApi.search(query),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
