import type { NameSubmitResult } from "@/components/common/nameField";
import type { AdminApiError } from "@/features/user";

/** Một chủ đề trên màn quản trị (`GET /admin/topics`, UC-CD-01). */
export interface AdminTopic {
  id: string;
  name: string;
  /** Số bài học đã xuất bản thuộc chủ đề (BR-CD-05). */
  publishedLessons: number;
  /** Đang hiển thị khi có ít nhất 1 bài đã xuất bản (BR-CD-04). */
  visible: boolean;
  updatedAt: string;
}

/** Lọc trạng thái hiển thị: "" là tất cả. */
export type TopicVisibilityFilter = "" | "visible" | "hidden";

export interface TopicListFilter {
  q: string;
  visibility: TopicVisibilityFilter;
}

export const EMPTY_TOPIC_FILTER: TopicListFilter = { q: "", visibility: "" };

/** Tham số gửi lên `GET /admin/topics`; bỏ trống tham số khi không lọc. */
export function topicListParams(filter: TopicListFilter): { q?: string; visible?: boolean } {
  const params: { q?: string; visible?: boolean } = {};
  const q = filter.q.trim();
  if (q) params.q = q;
  if (filter.visibility) params.visible = filter.visibility === "visible";
  return params;
}

export function hasTopicFilter(filter: TopicListFilter): boolean {
  return filter.q.trim() !== "" || filter.visibility !== "";
}

/**
 * Trạng thái phần thân danh sách: hệ thống chưa có chủ đề (UC-CD-01 2a), có chủ đề nhưng không khớp tìm kiếm hoặc
 * bộ lọc (4a), hoặc có dữ liệu.
 */
export function topicListState(items: readonly AdminTopic[], filter: TopicListFilter): "none" | "noMatch" | "items" {
  if (items.length > 0) return "items";
  return hasTopicFilter(filter) ? "noMatch" : "none";
}

/**
 * Lỗi lưu tên chủ đề: trùng tên hiện cạnh ô tên (5b); mất kết nối hoặc lỗi máy chủ hiện thông báo chung và giữ tên đã
 * nhập (6a); lỗi kiểm tra dữ liệu từ máy chủ hiện cạnh ô tên (5a).
 */
export function topicSaveError(
  error: AdminApiError,
  texts: { nameTaken: string; invalid: string; saveFailed: string },
): NameSubmitResult {
  // Mất kết nối hoặc lỗi máy chủ, giống isRetryable của user (không import để test chạy không cần i18n)
  if (error.kind === "network" || error.kind === "server" || error.kind === "unknown") {
    return { ok: false, notice: texts.saveFailed };
  }
  if (error.code === "TOPIC_NAME_TAKEN") return { ok: false, fieldError: texts.nameTaken };
  if (error.fieldErrors.some((f) => f.field === "name")) return { ok: false, fieldError: texts.invalid };
  return { ok: false, notice: texts.saveFailed };
}
