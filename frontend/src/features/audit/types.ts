/** Kiểu dữ liệu của màn nhật ký quản trị (UC-NK-01), khớp `AuditLogView` của backend. */

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PUBLISH"
  | "UNPUBLISH"
  | "RESOLVE"
  | "REJECT"
  | "RESTORE"
  | "LOCK"
  | "UNLOCK"
  | "CHANGE_ROLE"
  | "TRANSFER"
  | "GRANT_CREDIT"
  | "IMPORT"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGE"
  | "LOGIN_LOCKED";

/** Loại đối tượng (BR-NK-18); câu, nhóm thẻ, thẻ chỉ còn ở mục cũ, không còn được ghi. */
export type AuditEntityType =
  | "LESSON"
  | "SENTENCE"
  | "DECK"
  | "GROUP"
  | "CARD"
  | "REPORT"
  | "USER"
  | "SETTINGS"
  | "PLAN"
  | "TOPIC"
  | "CATEGORY";

/** Vai trò người thực hiện ghi trong nhật ký; "system" là thao tác tự động. */
export type AuditActorRole = "student" | "teacher" | "admin" | "system";

/** Khoảng thời gian của danh sách nhật ký (BR-NK-04). */
export type AuditPeriod = "D7" | "D30" | "D90" | "ALL";

export interface AuditPage<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Một mục nhật ký. `actorId` null là "Hệ thống"; `parentType`/`parentId` là đối tượng chứa (bài học, bộ thẻ). */
export interface AuditRow {
  id: number;
  action: AuditAction;
  targetType: AuditEntityType;
  targetId: string | null;
  targetName: string | null;
  parentType: AuditEntityType | null;
  parentId: string | null;
  actorId: string | null;
  actorName: string;
  actorRole: AuditActorRole;
  hasChanges: boolean;
  createdAt: string;
}


/** Đối tượng mở được bằng "Mở đối tượng" (BR-NK-17); `id` null với cấu hình credit. */
export interface AuditLink {
  type: AuditEntityType;
  id: string | null;
}

export interface AuditDetail {
  entry: AuditRow;
  /** Mỗi khóa là một trường, giá trị là `{ old, new }` (BR-NK-03). */
  changes: Record<string, unknown> | null;
  note: string | null;
  /** Tên hiện tại của bài học hoặc bộ thẻ chứa (với báo cáo). */
  parentName: string | null;
  /** Trang quản trị mở được; null khi đối tượng đã bị xóa. */
  open: AuditLink | null;
}

export interface AuditFilter {
  action: AuditAction | "";
  targetType: AuditEntityType | "";
  actorRole: AuditActorRole | "";
  period: AuditPeriod;
  q: string;
}
