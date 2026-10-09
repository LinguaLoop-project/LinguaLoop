export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: { empty: boolean; sorted: boolean; unsorted: boolean };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: { empty: boolean; sorted: boolean; unsorted: boolean };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  code?: string;
  message?: string;
}

export interface TopicRow {
  id: string;
  slug: string;
  name: string;
  nameVi: string | null;
  description: string;
  iconUrl: string | null;
  displayOrder: number;
  themeColor: string | null;
}

export interface ModeProgress {
  dictation?: number;
  shadowing?: number;
}

export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  titleVi?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  difficulty?: string | number;
  cefrLevel?: string | null;
  durationSec: number;
  viewCount?: number;
  sourceType?: string | null;
  youtubeVideoId?: string | null;
  videoUrl?: string | null;
  pro?: boolean;
  isProRequired?: boolean;
  locked?: boolean;
  isCompleted?: boolean;
  sentenceCount?: number;
  lastActivityAt?: string | null;
  progress?: ModeProgress;
}

export interface LibraryOverview {
  continueLessons?: LessonSummary[];
  currentLessons?: LessonSummary[];
  topicRows?: {
    topic: TopicResponse;
    totalLessons?: number;
    lessons: LessonSummary[];
  }[];
  topTopics?: {
    topic: TopicResponse;
    lessons: LessonSummary[];
  }[];
}

export interface TopicResponse {
  id: string;
  slug: string;
  name: string;
  nameVi: string | null;
  description: string;
  iconUrl: string | null;
  displayOrder: number;
  themeColor: string | null;
  totalLessons: number;
  completedLessons: number;
}

export interface SentenceResponse {
  id: string;
  lessonId: string;
  text: string;
  textVi: string | null;
  ipa: string | null;
  audioUrl: string | null;
  startTimeMs: number;
  endTimeMs: number;
  displayOrder: number;
}

export interface LessonDetail {
  id: string;
  slug: string;
  title: string;
  titleVi: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  sourceType: string | null;
  difficulty: number;
  durationSec: number;
  cefrLevel: string | null;
  isProRequired: boolean;
  isCompleted: boolean;
  sentenceCount: number;
  viewCount?: number;
  topic: TopicRow | null;
  relatedLessons: LessonSummary[];
}
