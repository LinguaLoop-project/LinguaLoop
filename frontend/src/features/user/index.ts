/** Phần các feature khác và khung ứng dụng được dùng: chuông thông báo trên thanh trên. */
export { default as NotificationBell } from "./components/NotificationBell";
/** Mở màn giao lại nội dung với sẵn bài học hoặc bộ thẻ được chọn, từ chi tiết báo cáo (UC-QT-06 nhánh 1a). */
export { preselectPath as contentTransferPath } from "./adminUsers";
/** Đổi lỗi API của màn quản trị thành lỗi có loại; dùng chung cho các màn quản trị khác (gói Pro, cấu hình credit). */
export { toAdminApiError } from "./api";
export { errorMessageKey, isRetryable } from "./adminUsers";
export type { AdminApiError } from "./types";
export { formatDate, formatDateTime, formatNumber, formatVnd } from "./adminFormat";
