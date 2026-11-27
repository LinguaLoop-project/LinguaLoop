import type { NameSubmitResult } from "@/components/common/nameField";
import type { AdminApiError } from "@/features/user";

/** Một danh mục trên màn quản trị (`GET /admin/vocab/categories`, UC-CD-04). */
export interface AdminCategory {
  id: string;
  name: string;
  /** Số bộ thẻ đã xuất bản thuộc danh mục (BR-CD-06). */
  publishedDecks: number;
  updatedAt: string;
}

/**
 * Trạng thái phần thân danh sách: hệ thống chưa có danh mục (UC-CD-04 2a), có danh mục nhưng không khớp từ khóa (4a),
 * hoặc có dữ liệu.
 */
export function categoryListState(items: readonly AdminCategory[], q: string): "none" | "noMatch" | "items" {
  if (items.length > 0) return "items";
  return q.trim() ? "noMatch" : "none";
}

/**
 * Lỗi lưu tên danh mục: trùng tên hiện cạnh ô tên (5b); mất kết nối hoặc lỗi máy chủ hiện thông báo chung và giữ tên đã
 * nhập (6a); lỗi kiểm tra dữ liệu từ máy chủ hiện cạnh ô tên (5a).
 */
export function categorySaveError(
  error: AdminApiError,
  texts: { nameTaken: string; invalid: string; saveFailed: string },
): NameSubmitResult {
  // Mất kết nối hoặc lỗi máy chủ, giống isRetryable của user (không import để test chạy không cần i18n)
  if (error.kind === "network" || error.kind === "server" || error.kind === "unknown") {
    return { ok: false, notice: texts.saveFailed };
  }
  if (error.code === "DECK_CATEGORY_NAME_TAKEN") return { ok: false, fieldError: texts.nameTaken };
  if (error.fieldErrors.some((f) => f.field === "name")) return { ok: false, fieldError: texts.invalid };
  return { ok: false, notice: texts.saveFailed };
}
