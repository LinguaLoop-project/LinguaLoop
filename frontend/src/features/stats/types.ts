/** Khoảng thống kê (BR-TH-03). */
export type StatsRange = "7d" | "30d" | "all";

export type HistoryMode = "all" | "dictation" | "shadowing" | "vocab" | "ai";

export type PracticeKind = "dictation" | "shadowing";

export interface Streak {
  current: number;
  longest: number;
  studiedToday: boolean;
  /** 7 ngày của tuần hiện tại từ thứ Hai; true là ngày đã học. */
  week: boolean[];
  /** Vị trí của hôm nay trong `week` (0 là thứ Hai). */
  todayIndex: number;
}

export interface StatsOverview {
  range: StatsRange;
  streak: Streak;
  sentences: { total: number; dictation: number; shadowing: number };
  lessons: { doing: number; done: number };
  vocab: {
    cards: { newCount: number; learning: number; reviewing: number; mastered: number };
    answered: number;
    correct: number;
    /** Null khi chưa trả lời lần nào. */
    accuracyPercent: number | null;
  };
  /** So với khoảng liền trước cùng độ dài; null với "Toàn bộ" hoặc khi khoảng liền trước chưa luyện câu nào (BR-TH-13). */
  comparison: { previousSentences: number; sentencesDelta: number } | null;
}

export type WordClass = "function" | "content" | "inflected" | "number" | "proper" | "other";

export interface DictationErrorRow {
  wordClass: WordClass;
  opportunities: number;
  errors: number;
  errorPercent: number;
  omitted: number;
  substituted: number;
  misspelled: number;
  /** Từ đã lộ do xin gợi ý; vẫn tính là sai. */
  revealed: number;
  lastWrongWord: string | null;
  /** Bài để "Luyện ngay"; null thì mở thư viện bài ở chế độ Nghe chép (BR-TH-14). */
  practiceLessonId: string | null;
}

export interface DictationErrors {
  range: StatsRange;
  classes: DictationErrorRow[];
}

/** Hoạt động trong một ngày của lịch nhiệt (BR-TH-15). */
export interface ActivityDay {
  date: string;
  count: number;
}

export interface ActivityMap {
  /** Thứ Hai đầu tiên của 13 tuần. */
  from: string;
  /** Hôm nay theo múi giờ của học viên. */
  to: string;
  /** Chỉ các ngày có hoạt động, cũ đến mới. */
  days: ActivityDay[];
}

/** Một từ nghe sai nhiều (BR-TH-16). */
export interface WrongWord {
  word: string;
  wordClass: WordClass;
  wrongCount: number;
  seenCount: number;
}

export interface WrongWords {
  range: StatsRange;
  words: WrongWord[];
}

export type HistoryType = "practice" | "vocab" | "ai";

/** Một dòng Lịch sử luyện tập; các trường không áp dụng cho loại dòng đó là null. */
export interface HistoryItem {
  type: HistoryType;
  /** dictation/shadowing (practice), learn/review (vocab), live/text (ai). */
  mode: string;
  at: string;
  title: string | null;
  available: boolean;
  lessonId: string | null;
  deckId: string | null;
  /** Loại bộ của dòng vocab: thư viện, cá nhân hoặc "Từ đã lưu". */
  deckKind: "library" | "personal" | "saved" | null;
  /** Ngày lịch của Buổi luyện (yyyy-MM-dd), để xin danh sách lượt. */
  day: string | null;
  sentences: number | null;
  averageScore: number | null;
  retries: number | null;
  gaveUps: number | null;
  answered: number | null;
  correct: number | null;
}

export interface HistoryPage {
  items: HistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PracticeSessionAttempt {
  attemptId: number;
  sentenceId: string;
  text: string;
  at: string;
  score: number;
  kind: "normal" | "retry" | "gave_up";
}

export interface PracticeSessionDetail {
  lessonId: string;
  lessonTitle: string;
  available: boolean;
  attempts: PracticeSessionAttempt[];
}

export type PhonemeLevel = "insufficient" | "good" | "attention" | "bad";

export type PhonemeKind = "vowel" | "diphthong" | "consonant";

export interface PhonemeCell {
  symbol: string;
  kind: PhonemeKind;
  exampleWord: string | null;
  total: number;
  errors: number;
  /** Null khi chưa đủ 5 lần gặp. */
  errorPercent: number | null;
  level: PhonemeLevel;
}

export interface ScorePoint {
  /** Ngày đầu của mốc (ngày, hoặc thứ Hai của tuần khi `weekly`). */
  from: string;
  averageScore: number;
  attempts: number;
}

export interface PronunciationOverview {
  range: StatsRange;
  weekly: boolean;
  scores: ScorePoint[];
  /** Điểm trung bình cả khoảng đang lọc; null khi chưa có lượt Shadowing nào. */
  averageScore: number | null;
  /** Chênh lệch với khoảng liền trước; null với "Toàn bộ" hoặc khi khoảng liền trước chưa có lượt nào (BR-TH-13). */
  scoreDelta: number | null;
  phonemes: PhonemeCell[];
}

export interface WeekPoint {
  weekStart: string;
  total: number;
  errors: number;
  errorPercent: number | null;
}

export interface PhonemeDetail {
  cell: PhonemeCell;
  confusedAs: string | null;
  mostlyOmitted: boolean;
  tip: string | null;
  /** Đủ 8 tuần gần nhất; rỗng khi âm chưa đủ dữ liệu. */
  trend: WeekPoint[];
  /** Bài để "Luyện ngay"; null thì mở thư viện bài ở chế độ Shadowing (BR-TH-10). */
  practiceLessonId: string | null;
}
