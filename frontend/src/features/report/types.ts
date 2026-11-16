/** Kiểu dữ liệu của báo cáo nội dung (UC-BC-01) và màn xử lý báo cáo (UC-XL-01 đến 03), khớp `ReportView` backend. */

export type ReportTargetType = "sentence" | "card";

export type ReportReason =
  | "subtitle_en"
  | "ipa"
  | "translation"
  | "timing"
  | "word"
  | "phonetic"
  | "meaning"
  | "example"
  | "offensive"
  | "other";

export type ReportStatus = "waiting_teacher" | "waiting_admin" | "resolved" | "rejected";

export type ReviewRole = "teacher" | "admin";

/** Thao tác tác nhân được làm trên một dòng (BR-XL-02). `takedown` và `assign` chưa có màn hình. */
export type ReportAction = "resolve" | "reject" | "takedown" | "assign";

/** Loại nội dung mang dấu "Bị gỡ do báo cáo". */
export type RepublishTarget = "lesson" | "deck";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Một dòng danh sách: các báo cáo trùng cùng trạng thái gộp lại (BR-XL-06). `id` là báo cáo mới nhất của dòng. */
export interface ReportItem {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  content: string;
  containerId: string;
  containerName: string;
  reason: ReportReason;
  reportCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
  status: ReportStatus;
  overdue: boolean;
  ownerId: string | null;
  ownerName: string | null;
  noHandler: boolean;
  containerDeleted: boolean;
}

export interface ReporterStats {
  submitted: number;
  rejected: number;
}

/** Một báo cáo trong dòng; tên và số liệu người báo chỉ có với quản trị viên (BR-XL-09). */
export interface ReportEntry {
  id: string;
  reportedAt: string;
  suggestedFix: string | null;
  fixField: string | null;
  description: string | null;
  status: ReportStatus;
  handledAt: string | null;
  /** Rỗng khi báo cáo đã đóng nghĩa là "Hệ thống". */
  handledBy: string | null;
  handlingNote: string | null;
  reporterId: string | null;
  reporterName: string | null;
  reporterStats: ReporterStats | null;
}

export interface ReportDetail {
  item: ReportItem;
  /** Nội dung lúc báo (BR-BC-10); khóa là tên cột. */
  snapshot: Record<string, string | null>;
  current: Record<string, string | null>;
  reports: ReportEntry[];
  actions: ReportAction[];
  /** Số báo cáo sẽ được đóng nếu gỡ nội dung (BR-XL-13); 0 nếu không được gỡ. */
  takedownCount: number;
  /** Ảnh minh họa hiện tại của thẻ; null với câu hoặc thẻ không có ảnh (UC-XL-01 nhánh 8a). */
  imageUrl: string | null;
}

/** Bộ lọc danh sách (BR-XL-03). `status` "default" là lọc sẵn báo cáo đang chờ tác nhân. */
export interface ReportFilter {
  status: ReportStatus | "default" | "all";
  type: ReportTargetType | "";
  reason: ReportReason | "";
  overdue: boolean;
  q: string;
  sort: "newest" | "oldest";
  /** Chỉ quản trị viên. */
  noHandler: boolean;
  frequentRejected: boolean;
  reporterId: string | null;
  /** Giáo viên chủ của nội dung bị báo (AC-XL-09). */
  ownerId: string | null;
}

/** Giáo viên chủ có nội dung bị báo, cho bộ lọc của quản trị viên. */
export interface ReportOwner {
  id: string;
  name: string;
}

export interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  suggestedFix: string | null;
  /** Trường bản sửa thay vào (BR-BC-11). */
  fixField: string | null;
  description: string | null;
}

export interface ReportFieldError {
  field: string;
  code: string;
}

export interface ReportApiError {
  kind: "network" | "unauthorized" | "forbidden" | "notFound" | "conflict" | "validation" | "notFixed" | "server" | "unknown";
  status: number | null;
  code: string | null;
  fieldErrors: ReportFieldError[];
  details: Record<string, unknown>;
}

/** Dấu "Bị gỡ do báo cáo" của bài học hoặc bộ thẻ, cho màn giáo viên (BR-XL-13). */
export interface TakedownStatus {
  takenDown: boolean;
  reason: string | null;
  pending: boolean;
  lastRejectReason: string | null;
  /** Câu hoặc thẻ bị báo trong bản chụp lúc gỡ; `fixed` là đã khác lúc gỡ hoặc đã xóa (BR-XL-13). */
  items: TakedownItem[];
}

export interface TakedownItem {
  id: string;
  label: string;
  fixed: boolean;
}

export interface RepublishItem {
  id: string;
  targetType: RepublishTarget;
  targetId: string;
  targetName: string;
  ownerName: string | null;
  takedownReason: string;
  requestedAt: string;
}

/** Một câu hoặc thẻ bị báo: nội dung lúc gỡ và hiện tại; `deleted` thì `current` rỗng. */
export interface RepublishChange {
  id: string;
  snapshot: Record<string, string | null>;
  current: Record<string, string | null>;
  deleted: boolean;
}

export interface RepublishDetail {
  item: RepublishItem;
  status: "pending" | "approved" | "rejected";
  changes: RepublishChange[];
}
