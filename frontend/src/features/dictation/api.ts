import { axiosClient } from "@/api/axiosClient";
import type {
  ApiResponse,
  AttemptResult,
  DictationLesson,
  DictationLevel,
  DictationPrompt,
  RevealWordBody,
  LatestResult,
  RevealWordResult,
  SentenceNote,
  SubmitAttemptBody,
} from "./types";

/**
 * Hết hạn thì axios hủy request và báo như mất kết nối. Không có hạn này, một kết nối treo (mất sóng giữa chừng)
 * làm nút Kiểm tra quay mãi mà không báo lỗi hay cho thử lại.
 */
const REQUEST_TIMEOUT_MS = 15_000;

export const dictationApi = {
  getLesson: async (slug: string): Promise<DictationLesson> => {
    const response = await axiosClient.get<ApiResponse<DictationLesson>>(
      `/dictation/lessons/${encodeURIComponent(slug)}`,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  getPrompt: async (sentenceId: string, level: DictationLevel): Promise<DictationPrompt> => {
    const response = await axiosClient.get<ApiResponse<DictationPrompt>>(
      `/dictation/sentences/${sentenceId}/prompt`,
      { params: { level }, timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  revealWord: async (sentenceId: string, body: RevealWordBody): Promise<RevealWordResult> => {
    const response = await axiosClient.post<ApiResponse<RevealWordResult>>(
      `/dictation/sentences/${sentenceId}/reveal`,
      body,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  /** Kết quả từng từ của lượt gần nhất của câu; 404 nếu chưa làm. */
  getLatestAttempt: async (sentenceId: string): Promise<AttemptResult> => {
    const response = await axiosClient.get<ApiResponse<AttemptResult>>(
      `/dictation/sentences/${sentenceId}/attempts/latest`,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  /** Mọi lượt làm của câu, mới nhất trước. */
  getAttemptHistory: async (sentenceId: string): Promise<LatestResult[]> => {
    const response = await axiosClient.get<ApiResponse<LatestResult[]>>(
      `/dictation/sentences/${sentenceId}/attempts`,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  /** Kết quả từng từ của một lượt trong lịch sử. */
  getAttempt: async (sentenceId: string, attemptId: number): Promise<AttemptResult> => {
    const response = await axiosClient.get<ApiResponse<AttemptResult>>(
      `/dictation/sentences/${sentenceId}/attempts/${attemptId}`,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  saveNote: async (sentenceId: string, content: string): Promise<SentenceNote> => {
    const response = await axiosClient.put<ApiResponse<SentenceNote>>(
      `/sentences/${sentenceId}/note`,
      { content },
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  deleteNote: async (sentenceId: string): Promise<void> => {
    await axiosClient.delete(`/sentences/${sentenceId}/note`, { timeout: REQUEST_TIMEOUT_MS });
  },

  /** Ghim câu vào Câu cần ôn. */
  pinReview: async (sentenceId: string): Promise<void> => {
    await axiosClient.put(`/review/dictation/sentences/${sentenceId}`, null, { timeout: REQUEST_TIMEOUT_MS });
  },

  /** Gỡ câu khỏi Câu cần ôn ("Đã ổn" hoặc bỏ ghim). */
  resolveReview: async (sentenceId: string): Promise<void> => {
    await axiosClient.delete(`/review/dictation/sentences/${sentenceId}`, { timeout: REQUEST_TIMEOUT_MS });
  },

  submitAttempt: async (sentenceId: string, body: SubmitAttemptBody): Promise<AttemptResult> => {
    const response = await axiosClient.post<ApiResponse<AttemptResult>>(
      `/dictation/sentences/${sentenceId}/attempts`,
      body,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },
};
