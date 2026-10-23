/** Khớp với DTO backend (`/api/v1/review/dictation/sentences`, `/api/v1/notes`). Đổi DTO thì đổi cả file này. */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export type DictationLevel = "easy" | "normal" | "hard";

/** Vì sao câu vào Câu cần ôn: điểm thấp hoặc người học tự ghim. */
export type ReviewReason = "low_score" | "many_mistakes" | "replayed_often" | "manual";

export interface ReviewSentence {
  sentenceId: string;
  reason: ReviewReason;
  addedAt: string;
  lessonSlug: string;
  lessonTitle: string;
  sortOrder: number;
  text: string;
  textVi: string | null;
  /** Null chỉ khi dữ liệu lệch (câu ở trong danh sách mà không còn lượt nào). */
  lastScore: number | null;
  lastLevel: DictationLevel | null;
  lastAttemptedAt: string | null;
}

export interface NoteEntry {
  sentenceId: string;
  content: string;
  updatedAt: string;
  lessonSlug: string;
  lessonTitle: string;
  sortOrder: number;
  text: string;
  textVi: string | null;
}
