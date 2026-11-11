/** Khớp với DTO backend (feature vocab, `/api/v1/vocab/**`, record `SavedWordView`). Đổi DTO thì đổi cả file này. */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Trạng thái thẻ của người học (BR-HT-08). */
export type CardStatus = "new" | "learning" | "reviewing" | "mastered";

export type SavedWordSource = "dictionary" | "lesson";

export interface SavedWordLesson {
  lessonId: string;
  title: string;
  /** Câu trong bài mà từ được bấm lưu. */
  sentenceId: string;
}

/** Một nghĩa của một mục từ đã lưu, kèm trạng thái ôn của thẻ tương ứng; `id` là id thẻ. */
export interface SavedWord {
  id: string;
  headword: string;
  pos: string | null;
  meaningNo: number | null;
  meaningVi: string | null;
  definitionEn: string | null;
  definitionVi: string | null;
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
  /** Thẻ đến hạn ôn ngay (BR-HT-13). */
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
  id: string;
  name: string;
}

/** Một bộ từ hệ thống kèm tiến độ của người học (`DeckView.Summary`). */
export interface DeckSummary {
  id: string;
  name: string;
  pro: boolean;
  /** Ảnh bìa bộ; null khi bộ chưa có ảnh. */
  thumbnailUrl: string | null;
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
  cardCount: number;
  /** Số thẻ đã học (không còn Mới). */
  studiedCount: number;
  /** Bộ Pro và người học dùng gói Free. */
  locked: boolean;
}

export interface DeckSampleWord {
  word: string;
  pos: string | null;
  meaningVi: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  audioUs: string | null;
}

export interface DeckDetail {
  deck: DeckSummary;
  parts: DeckPart[];
  sampleWords: DeckSampleWord[];
}

/** Cách học (UC-HT-02); giá trị khớp `AnswerRequest.Mode` của backend. */
export type LearnMode = "guess" | "flashcard" | "quiz" | "reverse_quiz";

/** Khoảng chờ tới lần ôn tới nếu chấm Flashcard với `quality` (1 Quên, 3 Khó, 4 Được, 5 Dễ). */
export interface LearnPreview {
  quality: number;
  minutes: number;
}

/** Một thẻ của phần đang học (`LearnView.Card`). */
export interface LearnCard {
  id: string;
  word: string;
  pos: string | null;
  meaningVi: string | null;
  definitionEn: string | null;
  definitionVi: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  audioUk: string | null;
  audioUs: string | null;
  status: CardStatus;
  previews: LearnPreview[];
  /** Câu gốc và bản dịch khi thẻ là từ đã lưu từ bài học (BR-HT-03). */
  contextEn: string | null;
  contextVi: string | null;
  /** Bài học nguồn; null nếu thẻ không lưu từ bài học hoặc bài đó không còn xem được. */
  lesson: { id: string; title: string } | null;
}

export interface LearnDeckRef {
  id: string;
  name: string;
  pro: boolean;
}

/** Một phần kèm toàn bộ thẻ; màn học tự chia thành các lượt 10 thẻ (`LearnView.PartDetail`). */
export interface PartDetail {
  deck: LearnDeckRef;
  index: number;
  name: string;
  parts: DeckPart[];
  cards: LearnCard[];
}

/** Một câu trả lời gửi lên server; `answerId` do client sinh để gửi lại không bị ghi hai lần. */
export interface AnswerInput {
  cardId: string;
  answerId: string;
  mode: LearnMode;
  correct: boolean;
  /** Đoán có dùng Gợi ý: đúng nhờ gợi ý tính mức Khó thay vì Được (BR-HT-12). */
  hintUsed?: boolean;
  /** Bắt buộc với Flashcard: 1 Quên, 3 Khó, 4 Được, 5 Dễ. */
  quality?: number;
  responseMs?: number;
}

/** Một câu trả lời trước khi trang học gắn `answerId`. */
export type AnswerDraft = Omit<AnswerInput, "answerId">;

/** Lượt ôn kế tiếp (`ReviewView.Queue`): tối đa 50 thẻ đến hạn của mọi bộ, hoặc của một bộ. */
export interface ReviewQueue {
  /** Chỉ có khi ôn riêng một bộ. */
  deck: LearnDeckRef | null;
  cards: LearnCard[];
  /** Tổng số thẻ đến hạn, có thể nhiều hơn số thẻ của lượt. */
  dueTotal: number;
  /** Thời điểm thẻ kế tiếp đến hạn; null nếu chưa có thẻ nào được hẹn. */
  nextDueAt: string | null;
}

export interface AnswerResult {
  status: CardStatus;
  nextReviewAt: string | null;
  intervalDays: number;
  /** Mức q server đã chấm; trống khi câu trả lời được gửi lại và không chấm lần nữa. */
  quality: number | null;
}

export interface SaveWordInput {
  headword: string;
  meaningNo: number;
  /** Có khi từ được bấm trong một câu của bài học. */
  sentenceId?: string;
}
