import { axiosClient } from "@/api/axiosClient";
import { dictationApi } from "@/features/dictation/api";
import type { ApiResponse, NoteEntry, ReviewSentence } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

export const mywordsApi = {
  /** Câu đang cần ôn, điểm lượt gần nhất thấp trước. */
  listReview: async (): Promise<ReviewSentence[]> => {
    const response = await axiosClient.get<ApiResponse<ReviewSentence[]>>("/review/dictation/sentences", {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },

  /** Ghi chú của người học, mới sửa trước; truyền `lessonSlug` để chỉ lấy ghi chú của một bài. */
  listNotes: async (lessonSlug?: string): Promise<NoteEntry[]> => {
    const response = await axiosClient.get<ApiResponse<NoteEntry[]>>("/notes", {
      params: lessonSlug ? { lessonSlug } : undefined,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },

  // Ghi và xoá dùng chung lời gọi với màn nghe chép để hai nơi không lệch nhau.
  resolveReview: dictationApi.resolveReview,
  saveNote: dictationApi.saveNote,
  deleteNote: dictationApi.deleteNote,
};
