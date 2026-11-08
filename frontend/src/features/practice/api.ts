import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse, NoteEntry, PracticeMode, ReviewReason, ReviewSentence, SentenceNote } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

/** Câu cần ôn và ghi chú, dùng chung cho nghe chép, Shadowing và trang Từ & câu đã lưu. */
export const practiceApi = {
  /** Câu đang cần ôn, điểm lượt gần nhất thấp trước. Bỏ `mode` để lấy cả hai chế độ; `lessonSlug` để chỉ lấy một bài. */
  listReview: async (mode?: PracticeMode, lessonSlug?: string): Promise<ReviewSentence[]> => {
    const response = await axiosClient.get<ApiResponse<ReviewSentence[]>>(
      mode ? `/review/${mode}/sentences` : "/review/sentences",
      { params: lessonSlug ? { lessonSlug } : undefined, timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  /**
   * Lưu câu vào Câu cần ôn của một chế độ: `manual` khi người học tự ghim, `low_score` khi chọn lưu ở hộp hỏi sau
   * lượt điểm thấp.
   */
  pinReview: async (mode: PracticeMode, sentenceId: string, reason: ReviewReason = "manual"): Promise<void> => {
    await axiosClient.put(`/review/${mode}/sentences/${sentenceId}`, null, {
      params: { reason },
      timeout: REQUEST_TIMEOUT_MS,
    });
  },

  /** Gỡ câu khỏi Câu cần ôn của một chế độ ("Đã ổn" hoặc bỏ ghim). */
  resolveReview: async (mode: PracticeMode, sentenceId: string): Promise<void> => {
    await axiosClient.delete(`/review/${mode}/sentences/${sentenceId}`, { timeout: REQUEST_TIMEOUT_MS });
  },

  /**
   * Ghi chú của người học, mới sửa trước; truyền `lessonSlug` để chỉ lấy ghi chú của một bài và `mode` để chỉ lấy một
   * chế độ.
   */
  listNotes: async (lessonSlug?: string, mode?: PracticeMode): Promise<NoteEntry[]> => {
    const response = await axiosClient.get<ApiResponse<NoteEntry[]>>("/notes", {
      params: { ...(lessonSlug ? { lessonSlug } : {}), ...(mode ? { mode } : {}) },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },

  /** Lưu ghi chú của câu ở một chế độ (thay nội dung cũ nếu có). */
  saveNote: async (mode: PracticeMode, sentenceId: string, content: string): Promise<SentenceNote> => {
    const response = await axiosClient.put<ApiResponse<SentenceNote>>(
      `/sentences/${sentenceId}/notes/${mode}`,
      { content },
      { timeout: REQUEST_TIMEOUT_MS },
    );
    return response.data.data;
  },

  deleteNote: async (mode: PracticeMode, sentenceId: string): Promise<void> => {
    await axiosClient.delete(`/sentences/${sentenceId}/notes/${mode}`, { timeout: REQUEST_TIMEOUT_MS });
  },
};
