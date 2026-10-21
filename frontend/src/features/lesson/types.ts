/** Khớp với DTO backend (feature lesson). Đổi DTO thì đổi cả file này. */

/** `common/response/PageResponse`; `page` đánh số từ 0. */
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  code?: string;
  message?: string;
}

export interface ModeProgress {
  dictationPercent: number;
  shadowingPercent: number;
  /** Tổng thời gian học bài này (giây), cả hai chế độ. */
  studyTimeSec: number;
}

export interface TopicResponse {
  id: string;
  slug: string;
  name: string;
  nameVi: string | null;
  icon: string | null;
  sortOrder: number;
  totalLessons: number;
  completedLessons: number;
}

export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  titleVi: string | null;
  difficulty: string | null;
  sourceType: string | null;
  durationSec: number | null;
  viewCount: number;
  thumbnailUrl: string | null;
  pro: boolean;
  /** Bài Pro mà người dùng hiện tại chưa có gói Pro. */
  locked: boolean;
  sentenceCount: number;
  progress: ModeProgress;
}

export interface TopicRow {
  topic: TopicResponse;
  totalLessons: number;
  lessons: LessonSummary[];
}

export interface LibraryOverview {
  continueLessons: LessonSummary[];
  topicRows: TopicRow[];
}

export interface SentenceResponse {
  id: string;
  text: string;
  textVi: string | null;
  ipa: string | null;
  startMs: number;
  endMs: number;
  cefrLevel: string | null;
  myBestScore: SentenceBestScores;
}

/** Điểm cao nhất của người học cho câu, tách theo chế độ; chế độ chưa có điểm thì vắng hoặc null. */
export interface SentenceBestScores {
  dictation?: number | null;
  shadowing?: number | null;
}

export interface LessonDetail {
  id: string;
  slug: string;
  title: string;
  titleVi: string | null;
  description: string | null;
  difficulty: string | null;
  sourceType: string | null;
  sourceUrl: string | null;
  durationSec: number | null;
  viewCount: number;
  thumbnailUrl: string | null;
  pro: boolean;
  locked: boolean;
  sentenceCount: number;
  progress: ModeProgress;
  topic: TopicResponse | null;
  relatedLessons: LessonSummary[];
}

/** Giá trị `state` của GET /lessons. */
export type LessonState = "todo" | "doing" | "done";
