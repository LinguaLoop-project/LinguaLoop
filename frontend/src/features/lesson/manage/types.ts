/** Khớp DTO backend `LessonManageView`, `CreatedLessonResponse`, `SentenceSuggestionResponse`. Đổi DTO thì đổi file này. */

export type ManageRole = "teacher" | "admin";
export type LessonStatus = "draft" | "published";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Bộ lọc trạng thái của giáo viên; "all" gồm Nháp và Đã xuất bản, không gồm bài đã xóa (UC-BH-01). */
export type StatusFilter = "all" | "published" | "draft" | "deleted";

export interface LessonListFilter {
  q: string;
  topicId: string | null;
  cefrLevel: CefrLevel | null;
  pro: boolean;
  status: StatusFilter;
  ownerId: string | null;
}

export const DEFAULT_FILTER: LessonListFilter = {
  q: "",
  topicId: null,
  cefrLevel: null,
  pro: false,
  status: "all",
  ownerId: null,
};

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface LessonItem {
  id: string;
  title: string;
  youtubeId: string;
  thumbnailUrl: string;
  topicId: string | null;
  topicName: string | null;
  cefrLevel: CefrLevel;
  pro: boolean;
  status: LessonStatus;
  sentenceCount: number;
  updatedAt: string;
  deletedAt: string | null;
  unpublishReason: string | null;
  ownerId: string;
  ownerName: string | null;
}

export interface LessonSentence {
  id: string;
  position: number;
  startMs: number;
  endMs: number;
  textEn: string;
  ipaUs: string | null;
  ipaUk: string | null;
  textVi: string | null;
}

export interface LessonDetail {
  id: string;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  durationSec: number;
  topicId: string | null;
  topicName: string | null;
  cefrLevel: CefrLevel;
  pro: boolean;
  status: LessonStatus;
  sentenceCount: number;
  createdAt: string;
  updatedAt: string;
  unpublishReason: string | null;
  ownerId: string;
  ownerName: string | null;
  /** Bài đã từng xuất bản: không tách, gộp câu được nữa (BR-BH-13). */
  structureLocked: boolean;
  sentences: LessonSentence[];
}

export interface TopicOption {
  id: string;
  name: string;
}

/** Video xem trước khi dán link (UC-BH-03 Bước 3); `title` là tên video, đã cắt còn 100 ký tự. */
export interface YouTubePreview {
  youtubeId: string;
  title: string;
  durationSec: number;
}

export interface CreateLessonInput {
  youtubeUrl: string;
  title: string;
  topicId: string;
  cefrLevel: CefrLevel;
  pro: boolean;
}

export type SuggestionOutcome = "COMPLETE" | "AI_FAILED";

/** Bài Nháp vừa tạo; bản dịch để trống, giáo viên tự nhập hoặc tạo gợi ý (UC-BH-10). */
export interface CreatedLesson {
  id: string;
  title: string;
  sentenceCount: number;
  ipaCount: number;
}

export interface UpdateLessonInput {
  title: string;
  topicId: string;
  cefrLevel: CefrLevel;
  pro: boolean;
}

export interface SentenceEdit {
  id: string;
  textEn: string;
  ipaUs: string | null;
  ipaUk: string | null;
  textVi: string | null;
  startMs: number;
  endMs: number;
}

/** Câu mới khi tách câu; `key` là khóa tạm để server trả lỗi về đúng câu. */
export interface NewSentence {
  key: string;
  textEn: string;
  ipaUs: string | null;
  ipaUk: string | null;
  textVi: string | null;
  startMs: number;
  endMs: number;
}

export interface SuggestInput {
  sentences: { id: string; textEn: string }[];
  translation: boolean;
  ipa: boolean;
}

export interface SuggestionResult {
  sentences: { id: string; textVi: string | null; ipaUs: string | null; ipaUk: string | null }[];
  translatedCount: number;
  ipaCount: number;
  translationOutcome: SuggestionOutcome | null;
}

/** Lỗi của một ô câu do server trả (`details.errors[]` của `LESSON_SENTENCES_INVALID`). */
export interface SentenceFieldError {
  sentenceId: string;
  field: string;
  code: string;
}

export interface LessonApiError {
  kind: "network" | "unauthorized" | "forbidden" | "notFound" | "conflict" | "validation" | "server" | "unknown";
  status: number | null;
  code: string | null;
  message: string | null;
  fieldErrors: { field: string; code: string }[];
  details: Record<string, unknown>;
}
