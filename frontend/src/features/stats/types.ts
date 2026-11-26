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

// ---------------------------------------------------------------- thống kê hệ thống của quản trị viên (UC-NK-02 đến 04)

/** Kiểu dữ liệu của các màn thống kê quản trị (UC-NK-02 đến 04), khớp DTO của backend. Số tiền tính bằng đồng. */

export type StatsPeriod = "D7" | "D30" | "D90";

/** Gói của học viên tại thời điểm luyện (BR-NK-12). */
export type PlanFilter = "ALL" | "FREE" | "PRO";

/** Một chỉ số kèm kỳ liền trước và mức tăng giảm %; null khi không tính được (BR-NK-07). */
export interface Metric {
  current: number | null;
  previous: number | null;
  changePct: number | null;
}

/** Số liệu theo ngày: đủ mọi ngày của khoảng (ngày trống là 0), mỗi chuỗi cùng độ dài với `days`. */
export interface DailySeries {
  days: string[];
  series: Record<string, number[]>;
}

export interface Accounts {
  total: number;
  students: number;
  teachers: number;
  admins: number;
  emailVerified: number;
  activePro: number;
  proRatioPct: number | null;
}

export interface PendingReport {
  reportId: string;
  content: string | null;
  reason: string;
  reporterName: string | null;
  createdAt: string;
}

export interface OverviewStats {
  computedAt: string;
  period: StatsPeriod;
  accounts: Accounts;
  newAccounts: Metric;
  recognizedRevenueVnd: number;
  publishedLessons: number;
  publishedDecks: number;
  pendingAdminReports: number;
  oldestPendingReports: PendingReport[];
  daily: DailySeries;
}

export interface RankedItem {
  id: string;
  name: string;
  ownerName: string | null;
  value: number;
}

export interface PracticeStats {
  computedAt: string;
  period: StatsPeriod;
  plan: PlanFilter;
  learners: Metric;
  dictationAttempts: Metric;
  shadowingAttempts: Metric;
  reviews: Metric;
  lessonsCompleted: Metric;
  dictationAvgScore: Metric;
  shadowingAvgScore: Metric;
  correctRatePct: Metric;
  daily: DailySeries;
  topLessons: RankedItem[];
  topDecks: RankedItem[];
}

/** Lãi lỗ của một tính năng tính credit (BR-NK-09). */
export interface FeatureUsage {
  feature: string;
  /** Lượt gọi thành công. */
  uses: number;
  /** Số đơn vị tính credit của các lượt đó (câu, phiên, bài...), cùng đơn vị với bảng dịch vụ tính credit. */
  units: number;
  credits: number;
  costVnd: number;
  /** Giá bán bình quân mỗi đơn vị = credit đã tiêu ÷ số đơn vị × giá trị 1 credit; null khi chưa có lần dùng. */
  pricePerUnitVnd: number | null;
  /** Chi phí bình quân mỗi đơn vị = chi phí thực tế ÷ số đơn vị; null khi chưa có lần dùng. */
  costPerUnitVnd: number | null;
  /** Dấu "Lỗ": chi phí bình quân mỗi đơn vị lớn hơn giá bán, không phụ thuộc ai dùng. */
  loss: boolean;
}

export interface AiTotals {
  netRevenueVnd: number;
  costVnd: number;
  /** Chi phí của học viên Free (dùng thử) và tỷ lệ trên tổng chi phí; tỷ lệ null khi chi phí bằng 0 (BR-NK-14). */
  trialCostVnd: number;
  trialCostPct: number | null;
  grossProfitVnd: number;
  grossMarginPct: number | null;
}

export interface TopAccount {
  userId: string;
  name: string;
  email: string;
  /** Gói hiện tại: pro, free, teacher hoặc admin. */
  plan: string | null;
  credits: number;
  costVnd: number;
}

export interface AiUsageStats {
  computedAt: string;
  period: StatsPeriod;
  creditValueVnd: number;
  features: FeatureUsage[];
  totals: AiTotals;
  creditsByFeature: DailySeries;
  topAccounts: TopAccount[];
}

// ---------------------------------------------------------------- thống kê nội dung của giáo viên (UC-TN-01 đến 03)

/** Tổng quan nội dung của giáo viên (UC-TN-01). Số lượng nội dung là số hiện tại; còn lại theo khoảng (BR-TN-03). */
export interface TeacherOverview {
  computedAt: string;
  period: StatsPeriod;
  content: { publishedLessons: number; draftLessons: number; publishedDecks: number; draftDecks: number };
  practiceAttempts: Metric;
  /** Học viên có lượt luyện bài học hoặc lượt ôn bộ thẻ của giáo viên, mỗi người tính một lần (BR-TN-02). */
  learners: number;
  /** Số dòng báo cáo đang chờ giáo viên xử lý, như danh sách "Báo cáo nội dung" (UC-XL-01). */
  openReports: number;
  /** Chuỗi "dictation", "shadowing", "review". */
  daily: DailySeries;
  topLessons: { id: string; title: string; learners: number; attempts: number; dictationAvgScore: number | null; shadowingAvgScore: number | null }[];
  topDecks: { id: string; name: string; learners: number; reviews: number; correctRatePct: number | null }[];
}

/** Câu khó của bài ở một chế độ; chỉ có câu từ 10 lượt trở lên ở chế độ đó (BR-TN-04). */
export interface TeacherHardSentence {
  id: string;
  /** Thứ tự câu trong bài, từ 1. */
  order: number;
  text: string;
  attempts: number;
  avgScore: number | null;
}

/** Thống kê một bài học (UC-TN-02). */
export interface TeacherLessonStats {
  computedAt: string;
  period: StatsPeriod;
  lessonId: string;
  title: string;
  status: "draft" | "published";
  learnersStarted: number;
  learnersCompleted: number;
  completionRatePct: number | null;
  dictationAttempts: number;
  shadowingAttempts: number;
  dictationAvgScore: number | null;
  shadowingAvgScore: number | null;
  daily: DailySeries;
  hardestDictation: TeacherHardSentence[];
  hardestShadowing: TeacherHardSentence[];
}

/** Thẻ khó; chỉ có thẻ từ 10 lượt ôn trở lên (BR-TN-04). */
export interface TeacherHardCard {
  id: string;
  word: string;
  reviews: number;
  correctRatePct: number | null;
}

/** Thống kê một bộ thẻ (UC-TN-03). */
export interface TeacherDeckStats {
  computedAt: string;
  period: StatsPeriod;
  deckId: string;
  name: string;
  status: "draft" | "published";
  learners: number;
  reviews: number;
  correctRatePct: number | null;
  /** Chuỗi "reviews", "correct". */
  daily: DailySeries;
  /** Tỷ lệ cặp (học viên, thẻ) ở từng trạng thái học; trống khi chưa có học viên (BR-TN-02). */
  cardStates: { newPct: number | null; learningPct: number | null; reviewingPct: number | null; masteredPct: number | null };
  /** Nhóm thẻ theo thứ tự trong bộ, mỗi nhóm tối đa 5 thẻ khó nhất. */
  groups: { id: string; name: string; hardestCards: TeacherHardCard[] }[];
}
