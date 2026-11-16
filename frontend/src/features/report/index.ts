/**
 * Phần các feature khác và khung ứng dụng được dùng: nút "Báo cáo" đặt ở câu hoặc thẻ (UC-BC-01), và khung "Bị gỡ do báo cáo" kèm nút gửi
 * yêu cầu xuất bản lại trên trang bài học hoặc bộ thẻ của giáo viên (UC-BH-06, UC-BT-05 nhánh 2b).
 */
export { default as ReportButton } from "./components/ReportButton";
export type { ReportButtonProps } from "./components/ReportButton";
export type { ReportTargetType } from "./types";
/** Số trên mục "Báo cáo nội dung" và "Duyệt xuất bản lại" của thanh bên. */
export { useIsTakenDown, useReportBadge } from "./hooks";
export type { ReportBadgeKind } from "./hooks";
export { default as TakedownNotice } from "./components/TakedownNotice";
export type { TakedownNoticeProps } from "./components/TakedownNotice";
