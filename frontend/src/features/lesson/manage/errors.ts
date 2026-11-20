import type { TFunction } from "i18next";
import type { LessonApiError } from "./types";

/**
 * Câu báo lỗi cho người dùng: mất kết nối có câu riêng; mã lỗi đã dịch thì dùng bản dịch; còn lại dùng câu server trả
 * (đã là tiếng Việt), cuối cùng là câu chung.
 */
export function errorMessage(t: TFunction, error: unknown): string {
  const e = error as Partial<LessonApiError> | null;
  if (e?.kind === "network") return t("errors.network");
  if (e?.code) {
    const key = `errors.${e.code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return e?.message ?? t("errors.generic");
}

/**
 * Lỗi do danh sách đang mở đã cũ (bài đã đổi trạng thái hoặc bị xóa ở cửa sổ khác, không có quyền): báo rồi đóng hộp
 * để danh sách tự làm mới. Lỗi kết nối hoặc máy chủ: giữ hộp để thử lại.
 */
export function isStaleError(error: unknown): boolean {
  const kind = (error as Partial<LessonApiError> | null)?.kind;
  return kind === "notFound" || kind === "forbidden" || kind === "conflict";
}
