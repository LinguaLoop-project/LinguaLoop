import type { RepublishTarget, ReportItem, ReviewRole } from "./types";

/** Màn duyệt yêu cầu xuất bản lại của quản trị viên (UC-XL-05). */
export const REPUBLISH_PATH = "/admin/republish";

export function reportListPath(role: ReviewRole): string {
  return role === "teacher" ? "/teacher/reports" : "/admin/reports";
}

export function reportDetailPath(role: ReviewRole, reportId: string): string {
  return `${reportListPath(role)}/${reportId}`;
}

/**
 * Trang xem toàn bộ nội dung đang bị gỡ cho quản trị viên (UC-XL-05 Bước 3). Bộ thẻ mở trang chi tiết bộ của quản trị
 * viên (xem được bộ Nháp đang bị gỡ, AC-BT-76); bài học chưa có trang của quản trị viên nên trả null.
 */
export function adminContentPath(targetType: RepublishTarget, targetId: string): string | null {
  return targetType === "deck" ? `/admin/decks/${targetId}` : null;
}

/** Màn sửa nội dung của giáo viên: trang bộ thẻ (UC-NT-05) hoặc trang bài học (UC-BH-05). */
export function contentEditPath(item: Pick<ReportItem, "targetType" | "containerId">): string {
  return item.targetType === "card" ? `/teacher/decks/${item.containerId}` : `/teacher/lessons/${item.containerId}`;
}
