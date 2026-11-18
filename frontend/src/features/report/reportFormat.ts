import type { ReportStatus, ReviewRole } from "./types";

/** Trạng thái đang chờ chính vai trò này xử lý (BR-XL-03). */
export const OWN_WAITING: Record<ReviewRole, ReportStatus> = { teacher: "waiting_teacher", admin: "waiting_admin" };

/**
 * Khóa i18n của nhãn trạng thái theo góc nhìn người xem: trạng thái đang chờ chính mình là "Chờ xử lý"; quản trị viên
 * thấy báo cáo đang chờ giáo viên là "Giáo viên đang xử lý".
 */
export function statusKey(role: ReviewRole, status: ReportStatus): string {
  return status === OWN_WAITING[role] ? "status.pending" : `status.${status}`;
}

/** Định dạng ngày giờ trên màn báo cáo theo ngôn ngữ giao diện. */

function locale(language: string): string {
  return language === "en" ? "en-GB" : "vi-VN";
}

export function formatDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(locale(language));
}

export function formatDateTime(iso: string, language: string): string {
  return new Date(iso).toLocaleString(locale(language), { dateStyle: "short", timeStyle: "short" });
}

/**
 * Các cột hiển thị trong so sánh "Nội dung lúc báo" và "Nội dung hiện tại", theo thứ tự cột của nội dung; cột có giá
 * trị ở một trong hai bên mới hiện. `changed` là cột đã khác bản chụp.
 */
/** Chữ hiển thị một ô so sánh: ảnh chỉ có S3 key nên hiện "Có ảnh"; ô trống hiện "—". */
export function cellText(field: string, value: string | null, t: (key: string) => string): string {
  if (value === null) return "—";
  return field === "image_url" ? t("detail.hasImage") : value;
}

export function compareRows(
  snapshot: Record<string, string | null>,
  current: Record<string, string | null>,
): { field: string; before: string | null; after: string | null; changed: boolean }[] {
  const fields = Array.from(new Set([...Object.keys(current), ...Object.keys(snapshot)]));
  const hasSnapshot = Object.keys(snapshot).length > 0;
  return fields
    .map((field) => {
      const before = snapshot[field] ?? null;
      const after = current[field] ?? null;
      // Cột không có trong bản chụp (bản chụp cũ trước khi chụp thêm ảnh) thì không tính là đã đổi.
      return { field, before, after, changed: hasSnapshot && field in snapshot && before !== after };
    })
    .filter((row) => row.before !== null || row.after !== null);
}
