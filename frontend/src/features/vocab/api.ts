import { isAxiosError } from "axios";
import { axiosClient } from "@/api/axiosClient";
import type {
  AnswerInput,
  AnswerResult,
  ApiResponse,
  DeckDetail,
  DeckList,
  PartDetail,
  ReviewQueue,
  SaveWordInput,
  SavedWord,
} from "./types";

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

  /** Các thẻ của phần `part` (tính từ 1); 404 nếu không có, 403 nếu phần bị khoá với gói Free. */
  getPart: async (slug: string, part: number): Promise<PartDetail> => {
    const response = await axiosClient.get<ApiResponse<PartDetail>>(
      `/vocab/decks/${encodeURIComponent(slug)}/parts/${part}`,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  /** Mở phiên học mới cho phần này; phiên còn mở trước đó được đóng. */
  openSession: async (slug: string, part: number): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<{ id: string }>>(
      `/vocab/decks/${encodeURIComponent(slug)}/parts/${part}/sessions`,
      undefined,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data.id;
  },

  /** Lượt ôn kế tiếp: tối đa 50 thẻ đến hạn; truyền `deck` để chỉ ôn một bộ (404 nếu bộ không có). */
  getReview: async (deck?: string): Promise<ReviewQueue> => {
    const response = await axiosClient.get<ApiResponse<ReviewQueue>>("/vocab/review", {
      params: deck ? { deck } : undefined,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },

  /** Mở phiên ôn mới; phiên còn mở trước đó được đóng. */
  openReviewSession: async (deck?: string): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<{ id: string }>>("/vocab/review/sessions", undefined, {
      params: deck ? { deck } : undefined,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data.id;
  },

  /** Ghi một câu trả lời; gửi lại cùng `answerId` thì server không ghi lại. */
  sendAnswer: async (sessionId: string, input: AnswerInput): Promise<AnswerResult> => {
    const response = await axiosClient.post<ApiResponse<AnswerResult>>(`/vocab/sessions/${sessionId}/answers`, input, {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },
};
