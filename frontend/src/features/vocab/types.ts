/** Khớp với DTO backend (feature vocab, `/api/v1/vocab/**`, record `SavedWordView`). Đổi DTO thì đổi cả file này. */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Trạng thái thẻ của người học (BR-VOCAB-06). */
export type CardStatus = "new" | "learning" | "reviewing" | "mastered";

export type SavedWordSource = "dictionary" | "lesson" | "manual";

export interface SavedWordLesson {
  slug: string;
  title: string;
  /** Câu trong bài mà từ được bấm lưu. */
  sentenceId: string;
}

/** Một nghĩa của một mục từ đã lưu, kèm trạng thái ôn của thẻ tương ứng. */
export interface SavedWord {
  id: string;
  headword: string;
  cefrLevel: string | null;
  pos: string | null;
  meaningNo: number | null;
  translationVi: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  /** URL phát được; null khi từ điển không có âm thanh. */
  audioUk: string | null;
  audioUs: string | null;
  source: SavedWordSource;
  /** Chỉ có khi từ lưu từ một bài học còn xem được. */
  lesson: SavedWordLesson | null;
  /** Câu gốc trong bài học (và bản dịch) khi từ lưu từ bài học. */
  contextEn: string | null;
  contextVi: string | null;
  status: CardStatus;
  nextReviewAt: string | null;
  /** Thẻ đến hạn ôn ngay (BR-VOCAB-09). */
  due: boolean;
  savedAt: string;
}

export interface SaveWordInput {
  headword: string;
  meaningNo: number;
  /** Có khi từ được bấm trong một câu của bài học. */
  sentenceId?: string;
}
