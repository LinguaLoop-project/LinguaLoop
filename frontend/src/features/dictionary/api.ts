import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse, WordView } from "./types";

const REQUEST_TIMEOUT_MS = 10_000;

export const SEARCH_LIMIT = 10;

export const dictionaryApi = {
  /** Tra một từ trong bài; 404 (DICTIONARY_WORD_NOT_FOUND) nếu từ điển không có. */
  lookup: async (word: string): Promise<WordView> => {
    const response = await axiosClient.get<ApiResponse<WordView>>(
      `/dictionary/word/${encodeURIComponent(word)}`,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  /** Tìm trong kho từ điển; không có kết quả thì trả mảng rỗng. */
  search: async (word: string, limit = SEARCH_LIMIT): Promise<WordView[]> => {
    const response = await axiosClient.get<ApiResponse<WordView[]>>("/dictionary/search", {
      params: { word, limit },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },
};
