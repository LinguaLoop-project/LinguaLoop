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

/** Số thẻ của người học ở từng trạng thái trong một bộ; `newCount` là thẻ chưa học lần nào. */
export interface DeckProgress {
  mastered: number;
  reviewing: number;
  learning: number;
  newCount: number;
}

/** Danh mục chứa bộ: Oxford, TOEIC, IELTS ... (`DeckView.Category`). */
export interface DeckCategory {
  slug: string;
  name: string;
  nameVi: string | null;
}

/** Một bộ từ hệ thống kèm tiến độ của người học (`DeckView.Summary`). */
export interface DeckSummary {
  id: string;
  slug: string;
  name: string;
  nameVi: string | null;
  cefrLevel: string | null;
  pro: boolean;
  category: DeckCategory | null;
  cardCount: number;
  groupCount: number;
  progress: DeckProgress;
  /** Thẻ của bộ đã đến hạn ôn. */
  dueCount: number;
}

/** Số thẻ của người học theo trạng thái trên mọi bộ, kể cả bộ "Từ đã lưu" (`DeckView.Overview`). */
export interface VocabOverview {
  due: number;
  learning: number;
  reviewing: number;
  mastered: number;
}

export interface DeckList {
  overview: VocabOverview;
  decks: DeckSummary[];
}

/** Một phần của bộ; `index` tính từ 0 (`DeckView.Part`). */
export interface DeckPart {
  index: number;
  name: string;
  nameVi: string | null;
  cardCount: number;
  /** Số thẻ đã học (không còn Mới). */
  studiedCount: number;
  /** Bộ Pro và người học dùng gói Free ở phần từ thứ ba trở đi. */
  locked: boolean;
}

export interface DeckSampleWord {
  word: string;
  pos: string | null;
  translationVi: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  audioUs: string | null;
}

export interface DeckDetail {
  deck: DeckSummary;
  parts: DeckPart[];
  sampleWords: DeckSampleWord[];
}

export interface SaveWordInput {
  headword: string;
  meaningNo: number;
  /** Có khi từ được bấm trong một câu của bài học. */
  sentenceId?: string;
}
