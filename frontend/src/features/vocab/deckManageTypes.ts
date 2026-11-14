// Kiểu dữ liệu của màn quản lý bộ thẻ cho giáo viên và quản trị viên (UC-BT-01, UC-BT-02).

export type ManageRole = "teacher" | "admin";

/** Một lựa chọn trong ô chọn: danh mục (`GET /{role}/vocab/categories`) hoặc chủ bộ. */
export interface CategoryOption {
  id: string;
  name: string;
}

/** `draft` | `published`; bộ đã xóa giữ trạng thái trước khi xóa và có `deletedAt`. */
export type DeckStatus = "draft" | "published";

/** Bộ lọc trạng thái của giáo viên; "all" gồm Nháp và Đã xuất bản, không gồm bộ đã xóa. */
export type DeckStatusFilter = "all" | "published" | "draft" | "deleted";

/** Một bộ trong danh sách của giáo viên (`DeckManageView.Item`). `imageUrl` null = ảnh mặc định. */
export interface TeacherDeckItem {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  groupCount: number;
  cardCount: number;
  pro: boolean;
  status: DeckStatus;
  updatedAt: string;
  deletedAt: string | null;
  /** Lý do quản trị viên gỡ xuất bản, hiện cạnh bộ cho giáo viên (BR-BT-08). */
  unpublishReason?: string | null;
}

/** Một bộ trong danh sách của quản trị viên; `ownerId` null = bộ hệ thống. */
export interface AdminDeckItem {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  groupCount: number;
  cardCount: number;
  pro: boolean;
  status: DeckStatus;
  updatedAt: string;
  ownerId: string | null;
  ownerName: string | null;
}

export type ManageDeckItem = TeacherDeckItem | AdminDeckItem;

/** Một trang dữ liệu (`PageResponse`), `page` đánh số từ 0. */
export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Điều kiện tìm và lọc. `categoryId` = một danh mục, `other` = mục "Khác" (không danh mục). `status` chỉ dùng cho giáo
 * viên; `ownerId` và `system` (chỉ bộ hệ thống) chỉ dùng cho quản trị viên.
 */
export interface DeckListFilter {
  q: string;
  categoryId: string | null;
  other: boolean;
  pro: boolean;
  status: DeckStatusFilter;
  ownerId: string | null;
  system: boolean;
}

export interface CreateDeckInput {
  name: string;
  categoryId: string | null;
  pro: boolean;
}

/** Sửa bộ (UC-BT-03): `removeImage` = về ảnh mặc định; ảnh mới gửi riêng dưới dạng `File`. */
export interface UpdateDeckInput extends CreateDeckInput {
  removeImage: boolean;
}

/** Một nhóm thẻ của bộ kèm số thẻ chưa xóa. */
export interface DeckGroup {
  id: string;
  name: string;
  cardCount: number;
}

/** Thông tin chung của bộ trên màn xem chi tiết (`DeckManageView.Detail`, UC-BT-04). `ownerId` null = bộ hệ thống. */
export interface DeckDetail {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  pro: boolean;
  status: DeckStatus;
  updatedAt: string;
  ownerId: string | null;
  ownerName: string | null;
  unpublishReason: string | null;
  cardCount: number;
  groups: DeckGroup[];
}

/** Một thẻ trong nhóm (BR-BT-15). */
export interface DeckCard {
  id: string;
  word: string;
  pos: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  meaningVi: string;
  definitionEn: string | null;
  definitionVi: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
  /** Ảnh minh họa của thẻ (BR-NT-03); `null` = không có ảnh. */
  imageUrl: string | null;
  /** URL audio phát âm lấy từ từ điển khi lưu thẻ (BR-NT-08); `null` thì đọc bằng giọng trình duyệt. */
  audioUk: string | null;
  audioUs: string | null;
}

/** Lỗi API đã phân loại để giao diện chọn thông báo. */
export type DeckApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "conflict"
  | "notFound"
  | "server"
  | "network"
  | "unknown";

export interface DeckFieldError {
  field: string;
  code: string;
}

/**
 * `code` là `ErrorResponse.code` của server (vd `VOCAB_DECK_NAME_TAKEN`) để phân biệt các lỗi cùng HTTP status;
 * `details` là dữ liệu kèm theo (vd `emptyGroups` khi bộ chưa đủ điều kiện xuất bản).
 */
export interface DeckApiError {
  kind: DeckApiErrorKind;
  status: number | null;
  message: string | null;
  fieldErrors: DeckFieldError[];
  code?: string | null;
  details?: Record<string, unknown>;
}
