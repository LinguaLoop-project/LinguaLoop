import type { PracticeMode } from "@/features/practice/types";

/** Một câu được chọn cho phiên ôn câu (`ReviewPlanSentence`): kèm video và mốc thời gian để phát. */
export interface PlanSentence {
  sentenceId: string;
  mode: PracticeMode;
  lessonId: string;
  lessonTitle: string;
  youtubeId: string;
  startMs: number;
  endMs: number;
  text: string;
  textVi: string | null;
  /** Điểm lượt gần nhất; null nếu chưa có. */
  lastScore: number | null;
}

/** Phần từ mới kế tiếp để học; `partNumber` tính từ 1 và khớp `/student/vocab/:deckId/parts/:part`. */
export interface NewWordsSuggestion {
  deckId: string;
  deckName: string;
  partNumber: number;
  partName: string;
  /** Số thẻ của một lượt học (tối đa 10). */
  newCards: number;
  /** Bộ người học đang học (true) hay bộ gợi ý mở đầu (false). */
  continuing: boolean;
}

/** Bài chưa luyện nghe chép để gợi ý. */
export interface LessonSuggestion {
  id: string;
  title: string;
  cefrLevel: string;
  sentenceCount: number;
}

export interface TodaySuggestions {
  newWords: NewWordsSuggestion | null;
  dictationLesson: LessonSuggestion | null;
  /** Bài chưa luyện Shadowing; ưu tiên bài người học đã nghe chép xong. */
  shadowingLesson: LessonSuggestion | null;
}

/** Kế hoạch Ôn tập hằng ngày (`DailyPlanView`). Thẻ lấy riêng từ `GET /vocab/review?limit=`. */
export interface DailyPlan {
  dailyMinutes: number;
  /** Số thẻ tối đa của cả ngày theo mục tiêu ngày (Định mức ôn ngày, BR-HT-24). */
  cardQuota: number;
  /** Tổng số thẻ đến hạn. */
  cardsDue: number;
  /** Số thẻ của phiên: phần định mức còn lại sau những thẻ đã ôn hôm nay, không quá số thẻ đến hạn (0 khi đã đủ). */
  cardsInPlan: number;
  /** Số thẻ đã ôn hôm nay trên mục tiêu của ngày (`cardsTarget`); không vượt mục tiêu. */
  cardsDoneToday: number;
  cardsTarget: number;
  /** Số thẻ của một lượt "Ôn thêm" (không tính định mức): `min(cardQuota, cardsDue)`. */
  cardsMore: number;
  nextCardDueAt: string | null;
  sentenceQuotaPerMode: number;
  /** Tổng số câu chưa ôn hôm nay (chưa cắt theo định mức). */
  sentencesPending: number;
  /** Số câu đã ôn hôm nay trên mục tiêu của ngày, cộng cả hai chế độ. */
  sentencesDoneToday: number;
  sentencesTarget: number;
  sentences: PlanSentence[];
  /** Chỉ có khi phiên trống (đã đủ định mức hoặc hết việc đến hạn): việc gợi ý thay cho phiên ôn. */
  suggestions: TodaySuggestions | null;
}

/** Kết quả một câu trong phiên ôn: `skipped` là học viên bỏ qua hoặc không chấm được, nên không được tính đã ôn. */
export interface SentenceOutcome {
  sentenceId: string;
  mode: PracticeMode;
  score: number | null;
  skipped: boolean;
}
