import type {
  AdminApiError,
  ContentType,
  TransferConflict,
  TransferFilter,
  TransferItem,
  UserListFilter,
} from "./types";

/** Màn quản trị tài khoản và giao lại nội dung (UC-QT-01, UC-QT-05). */
export const ADMIN_USERS_PATH = "/admin/users";
export const ADMIN_TRANSFERS_PATH = "/admin/transfers";

export const REASON_MAX = 500;

export const EMPTY_USER_FILTER: UserListFilter = { q: "", role: "", plan: "", status: "" };
export const EMPTY_TRANSFER_FILTER: TransferFilter = { q: "", type: "", owner: "" };

export function adminUserPath(userId: string): string {
  return `${ADMIN_USERS_PATH}/${userId}`;
}

/** Lý do khóa bắt buộc, 1 đến 500 ký tự sau khi bỏ khoảng trắng hai đầu (BR-QT-03). */
export function validateLockReason(reason: string): "NotBlank" | "Size" | null {
  const trimmed = reason.trim();
  if (!trimmed) return "NotBlank";
  if (trimmed.length > REASON_MAX) return "Size";
  return null;
}

export function hasUserFilters(filter: UserListFilter): boolean {
  return Boolean(filter.q.trim() || filter.role || filter.plan || filter.status);
}

export function hasTransferFilters(filter: TransferFilter): boolean {
  return Boolean(filter.q.trim() || filter.type || filter.owner);
}

export type ListState = "loading" | "error" | "empty" | "noResult" | "list";

/** Trạng thái hiển thị của một danh sách có bộ lọc: chưa có gì khác với lọc ra rỗng (có nút "Xóa bộ lọc"). */
export function listState(input: { isLoading: boolean; isError: boolean; count?: number; filtered: boolean }): ListState {
  if (input.isLoading && input.count === undefined) return "loading";
  if (input.isError) return "error";
  if (!input.count) return input.filtered ? "noResult" : "empty";
  return "list";
}

/** Lỗi khi lưu: mất kết nối và lỗi máy chủ thì giữ hộp để thử lại (UC-QT-02 6b, 03 6a, 04 6a, 06 8a, 07 8a). */
export function isRetryable(error: AdminApiError): boolean {
  return error.kind === "network" || error.kind === "server" || error.kind === "unknown";
}

/** Khóa i18n cho mã lỗi nghiệp vụ của backend; mã không biết thì dùng thông báo chung theo thao tác. */
export function errorMessageKey(error: AdminApiError, fallback: string): string {
  if (isRetryable(error)) return fallback;
  return error.code ? `errors.${error.code}` : fallback;
}

/** Mục bị trùng tên trong `details.conflicts` của lỗi `TRANSFER_NAME_CONFLICT` (BR-QT-07). */
export function conflictsOf(error: AdminApiError): TransferConflict[] {
  const conflicts = error.details.conflicts;
  return Array.isArray(conflicts) ? (conflicts as TransferConflict[]) : [];
}

/** Số bài học, số bộ thẻ và các giáo viên hiện tại của các mục đã chọn, cho hộp xác nhận (UC-QT-06 Bước 5). */
export function selectionSummary(items: TransferItem[]): { lessons: number; decks: number; owners: (string | null)[] } {
  const owners = [...new Set(items.map((item) => item.ownerName))];
  return {
    lessons: items.filter((item) => item.type === "lesson").length,
    decks: items.filter((item) => item.type === "deck").length,
    owners,
  };
}

/** Giáo viên đang giữ các mục, để loại khỏi danh sách giáo viên nhận (BR-QT-06). */
export function ownerIdsOf(items: TransferItem[]): string[] {
  return [...new Set(items.map((item) => item.ownerId).filter((id): id is string => id !== null))].sort();
}

export function selectionKey(item: Pick<TransferItem, "type" | "id">): string {
  return `${item.type}:${item.id}`;
}

/**
 * Đường dẫn mở màn giao lại nội dung với sẵn một mục được chọn, từ chi tiết báo cáo (UC-QT-06 nhánh 1a): bài học chứa
 * câu bị báo hoặc bộ thẻ chứa thẻ bị báo, kể cả bộ chưa gán chủ.
 */
export function preselectPath(input: {
  type: ContentType;
  id: string;
  name: string;
  ownerId: string | null;
  ownerName: string | null;
}): string {
  const params = new URLSearchParams({ assignType: input.type, assignId: input.id, assignName: input.name });
  if (input.ownerId) params.set("assignOwner", input.ownerId);
  if (input.ownerName) params.set("assignOwnerName", input.ownerName);
  return `${ADMIN_TRANSFERS_PATH}?${params.toString()}`;
}

/** Mục được chọn sẵn đọc từ URL; thiếu hoặc sai thì `null`. */
export function parsePreselect(params: URLSearchParams): TransferItem | null {
  const type = params.get("assignType");
  const id = params.get("assignId");
  if ((type !== "lesson" && type !== "deck") || !id) return null;
  return {
    type,
    id,
    name: params.get("assignName") ?? "",
    ownerId: params.get("assignOwner"),
    ownerName: params.get("assignOwnerName"),
    lockedAt: null,
    openReports: 0,
  };
}

/** Đường dẫn xem trước nội dung như học viên thấy, trên trang chi tiết của quản trị viên (UC-QT-05 nhánh 5a). */
export function previewPath(item: Pick<TransferItem, "type" | "id">): string {
  return item.type === "lesson" ? `/admin/lessons/${item.id}` : `/admin/decks/${item.id}`;
}
