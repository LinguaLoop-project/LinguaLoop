import { isAxiosError } from "axios";
import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "../types";
import { listParams } from "./listParams";
import type {
  CreatedLesson,
  CreateLessonInput,
  LessonApiError,
  LessonDetail,
  LessonItem,
  LessonListFilter,
  ManageRole,
  NewSentence,
  Page,
  SentenceEdit,
  SuggestInput,
  SuggestionResult,
  TopicOption,
  UpdateLessonInput,
  YouTubePreview,
} from "./types";

const REQUEST_TIMEOUT_MS = 15_000;
/** Tạo bài: lấy phụ đề, chia câu và tạo IPA; video dài có thể mất vài chục giây. */
const CREATE_TIMEOUT_MS = 3 * 60_000;
/** Gợi ý cho cả bài gọi Gemini nhiều lô. */
const SUGGEST_TIMEOUT_MS = 3 * 60_000;

/** Đổi lỗi axios thành `LessonApiError`; không có phản hồi (mất mạng, hết thời gian) là "network". */
export function toLessonApiError(error: unknown): LessonApiError {
  if (!isAxiosError(error)) {
    return { kind: "unknown", status: null, code: null, message: null, fieldErrors: [], details: {} };
  }
  const status = error.response?.status ?? null;
  const body = error.response?.data as
    | { message?: string; code?: string; errors?: { field: string; code: string }[]; details?: Record<string, unknown> }
    | undefined;
  const base = {
    status,
    code: body?.code ?? null,
    message: body?.message ?? null,
    fieldErrors: (body?.errors ?? []).map(({ field, code }) => ({ field, code })),
    details: body?.details ?? {},
  };
  if (status === null) return { kind: "network", ...base };
  if (status === 401) return { kind: "unauthorized", ...base };
  if (status === 403) return { kind: "forbidden", ...base };
  if (status === 404) return { kind: "notFound", ...base };
  if (status === 409) return { kind: "conflict", ...base };
  if (status === 400) return { kind: "validation", ...base };
  if (status >= 500) return { kind: "server", ...base };
  return { kind: "unknown", ...base };
}

async function wrap<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toLessonApiError(error);
  }
}

const base = (role: ManageRole) => `/${role}/lessons`;

/** API quản lý bài học (module BH); lỗi ném ra luôn là `LessonApiError`. */
export const lessonManageApi = {
  list: (role: ManageRole, filter: LessonListFilter, page: number): Promise<Page<LessonItem>> =>
    wrap(async () => {
      const response = await axiosClient.get<ApiResponse<Page<LessonItem>>>(base(role), {
        params: listParams(role, filter, page),
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  detail: (role: ManageRole, lessonId: string): Promise<LessonDetail> =>
    wrap(async () => {
      const response = await axiosClient.get<ApiResponse<LessonDetail>>(`${base(role)}/${lessonId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  /** Mọi chủ đề, kể cả chủ đề đang Chưa hiển thị (BR-BH-08). */
  topics: (): Promise<TopicOption[]> =>
    wrap(async () => {
      const response = await axiosClient.get<ApiResponse<TopicOption[]>>("/topics", { timeout: REQUEST_TIMEOUT_MS });
      return response.data.data.map(({ id, name }) => ({ id, name }));
    }),


  /** Kiểm link và đọc thông tin video, chưa gọi AI (UC-BH-03 Bước 3). */
  preview: (youtubeUrl: string): Promise<YouTubePreview> =>
    wrap(async () => {
      const response = await axiosClient.get<ApiResponse<YouTubePreview>>("/teacher/lessons/youtube/preview", {
        params: { url: youtubeUrl.trim() },
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  create: (input: CreateLessonInput): Promise<CreatedLesson> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<CreatedLesson>>(
        "/teacher/lessons/youtube",
        { ...input, title: input.title.trim() || null },
        { timeout: CREATE_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  update: (lessonId: string, input: UpdateLessonInput): Promise<LessonDetail> =>
    wrap(async () => {
      const response = await axiosClient.put<ApiResponse<LessonDetail>>(`/teacher/lessons/${lessonId}`, input, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  updateSentences: (
    lessonId: string,
    sentences: SentenceEdit[],
    deletedIds: string[],
    added: NewSentence[],
  ): Promise<LessonDetail> =>
    wrap(async () => {
      const response = await axiosClient.put<ApiResponse<LessonDetail>>(
        `/teacher/lessons/${lessonId}/sentences`,
        { sentences, deletedIds, added },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  suggest: (lessonId: string, input: SuggestInput): Promise<SuggestionResult> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<SuggestionResult>>(
        `/teacher/lessons/${lessonId}/suggestions`,
        input,
        { timeout: SUGGEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  publish: (lessonId: string): Promise<void> =>
    wrap(async () => {
      await axiosClient.post(`/teacher/lessons/${lessonId}/publish`, null, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Quản trị viên gửi kèm lý do (BR-BH-04); giáo viên không cần. */
  unpublish: (role: ManageRole, lessonId: string, reason: string | null): Promise<void> =>
    wrap(async () => {
      await axiosClient.post(`${base(role)}/${lessonId}/unpublish`, role === "admin" ? { reason } : null, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    }),

  remove: (lessonId: string): Promise<void> =>
    wrap(async () => {
      await axiosClient.delete(`/teacher/lessons/${lessonId}`, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** `title` chỉ gửi khi tiêu đề cũ đã bị trùng (UC-BH-09 6a). */
  restore: (lessonId: string, title: string | null): Promise<void> =>
    wrap(async () => {
      await axiosClient.post(`/teacher/lessons/${lessonId}/restore`, title ? { title: title.trim() } : {}, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    }),
};
