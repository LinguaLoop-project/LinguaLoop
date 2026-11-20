/** Kiểu dữ liệu màn quản trị tài khoản và giao lại nội dung (UC-QT-01 đến 07), khớp DTO của backend. */

export type AccountRole = "student" | "teacher" | "admin";
export type ChangeableRole = "student" | "teacher";
export type AccountPlan = "free" | "pro";
export type AccountStatus = "active" | "locked";
export type ContentType = "lesson" | "deck";

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUserRow {
  id: string;
  displayName: string;
  email: string;
  role: AccountRole;
  /** Chỉ có với học viên. */
  plan: AccountPlan | null;
  locked: boolean;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface UserActivity {
  kind: "dictation" | "shadowing" | "vocab";
  title: string;
  count: number;
  at: string;
}

export interface UserPayment {
  id: string;
  planName: string;
  months: number;
  amountVnd: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

/** Bài học và bộ thẻ thư viện chưa xóa của giáo viên, cùng số báo cáo đang chờ giáo viên này (BR-XL-12). */
export interface ContentCounts {
  publishedLessons: number;
  draftLessons: number;
  publishedDecks: number;
  draftDecks: number;
  openReports: number;
  waitingTeacherReports: number;
}

export interface AdminUserDetail {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: AccountRole;
  locked: boolean;
  lockedAt: string | null;
  lockedReason: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  recentActivities: UserActivity[];
  plan: AccountPlan | null;
  proEndsAt: string | null;
  payments: UserPayment[];
  content: ContentCounts | null;
  creditBalance: number | null;
}

export interface UserListFilter {
  q: string;
  role: AccountRole | "";
  plan: AccountPlan | "";
  status: AccountStatus | "";
}

/** Một mục cần giao; `ownerId` null = bộ thẻ chưa gán chủ ("Hệ thống"). */
export interface TransferItem {
  type: ContentType;
  id: string;
  name: string;
  ownerId: string | null;
  ownerName: string | null;
  lockedAt: string | null;
  openReports: number;
}

export interface TransferOwner {
  id: string | null;
  name: string | null;
  lockedAt: string | null;
  itemCount: number;
}

export interface TransferRecipient {
  id: string;
  displayName: string;
  email: string;
}

export interface TeacherSummary {
  teacherId: string;
  displayName: string;
  email: string;
  locked: boolean;
  lessons: number;
  draftLessons: number;
  decks: number;
  draftDecks: number;
  openReports: number;
}

export interface TransferResult {
  recipientId: string;
  recipientName: string;
  lessons: number;
  decks: number;
}

export interface TransferConflict {
  type: ContentType;
  id: string;
  name: string;
}

/** Giá trị lọc chủ nội dung cho bộ thẻ chưa gán chủ. */
export const SYSTEM_OWNER = "system";

export interface TransferFilter {
  q: string;
  type: ContentType | "";
  /** Id giáo viên, `system`, hoặc rỗng. */
  owner: string;
}

export type AdminApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "conflict"
  | "notFound"
  | "server"
  | "network"
  | "unknown";

export interface AdminApiError {
  kind: AdminApiErrorKind;
  status: number | null;
  code: string | null;
  message: string | null;
  fieldErrors: { field: string; code: string; message: string | null }[];
  details: Record<string, unknown>;
}
