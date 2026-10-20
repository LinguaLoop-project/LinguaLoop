import { axiosClient } from "@/api/axiosClient";
import type {
  ApiResponse,
  AttemptResult,
  DictationLesson,
  DictationLevel,
  DictationPrompt,
  RevealWordBody,
  RevealWordResult,
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

  submitAttempt: async (sentenceId: string, body: SubmitAttemptBody): Promise<AttemptResult> => {
    const response = await axiosClient.post<ApiResponse<AttemptResult>>(
      `/dictation/sentences/${sentenceId}/attempts`,
      body,
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },
};
