import { isAxiosError } from "axios";
import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse, DeckDetail, DeckList, SaveWordInput, SavedWord } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

/** Từ đã lưu của người học (`/api/v1/vocab/saved-words`). */
export const vocabApi = {
  /** Mọi từ đã lưu, mới lưu trước. */
  listSaved: async (): Promise<SavedWord[]> => {
    const response = await axiosClient.get<ApiResponse<SavedWord[]>>("/vocab/saved-words", {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },

  /** Lưu một nghĩa; nghĩa đã lưu thì trả bản hiện có, không lỗi. */
  saveWord: async (input: SaveWordInput): Promise<SavedWord> => {
    const response = await axiosClient.put<ApiResponse<SavedWord>>("/vocab/saved-words", input, {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },

  /** Bỏ lưu; từ đã được bỏ ở nơi khác (404) coi như xong, vì kết quả mong muốn đã đạt. */
  unsaveWord: async (id: string): Promise<void> => {
    try {
      await axiosClient.delete(`/vocab/saved-words/${id}`, { timeout: REQUEST_TIMEOUT_MS });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return;
      throw error;
    }
  },

  /** Bộ hệ thống kèm tiến độ của người học, và số thẻ theo trạng thái trên mọi bộ. */
  listDecks: async (): Promise<DeckList> => {
    const response = await axiosClient.get<ApiResponse<DeckList>>("/vocab/decks", { timeout: REQUEST_TIMEOUT_MS });
    return response.data.data;
  },

  /** Một bộ: các phần kèm tiến độ và vài từ mẫu; 404 nếu không có bộ này. */
  getDeck: async (slug: string): Promise<DeckDetail> => {
    const response = await axiosClient.get<ApiResponse<DeckDetail>>(`/vocab/decks/${encodeURIComponent(slug)}`, {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },
};
