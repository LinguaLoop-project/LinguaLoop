/** Khớp với DTO backend (`/api/v1/review/**`, `/api/v1/notes`, `/api/v1/sentences/{id}/note`). Đổi DTO thì đổi cả file này. */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Chế độ luyện: mỗi chế độ có danh sách Câu cần ôn riêng. */
export type PracticeMode = "dictation" | "shadowing";

export type DictationLevel = "easy" | "normal" | "hard";

/** Vì sao câu vào Câu cần ôn: điểm thấp hoặc người học tự ghim. */
export type ReviewReason = "low_score" | "many_mistakes" | "replayed_often" | "manual";

export interface ReviewSentence {
  sentenceId: string;
  mode: PracticeMode;
  reason: ReviewReason;
  addedAt: string;
  lessonSlug: string;
  lessonTitle: string;
  sortOrder: number;
  text: string;
  textVi: string | null;
  /** Null chỉ khi dữ liệu lệch (câu ở trong danh sách mà không còn lượt nào ở chế độ đó). */
  lastScore: number | null;
  /** Mức của lượt gần nhất; chỉ nghe chép có mức. */
  lastLevel: DictationLevel | null;
  lastAttemptedAt: string | null;
}

/** Ghi chú của người học cho một câu. */
export interface SentenceNote {
  sentenceId: string;
  content: string;
  updatedAt: string;
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
