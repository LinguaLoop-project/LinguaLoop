// Thao tác hiện trên mỗi bộ theo vai trò và trạng thái (UC-BT-01 bước 7, BR-BT-01). Bấm vào dòng của bộ chưa xóa thì
// mở trang bộ (xem và sửa tại chỗ, UC-BT-03, 04), nên danh sách không có nút "Xem" hay "Sửa" riêng.
import type { ManageRole } from "./deckManageTypes";

export type DeckAction = "publish" | "unpublish" | "delete" | "restore";

export interface DeckActionInput {
  status: "draft" | "published";
  deletedAt?: string | null;
}

export interface DeckActionsResult {
  actions: DeckAction[];
  /** Ngày xóa để hiển thị, chỉ với bộ đã xóa (AC-BT-04). */
  deletedAt: string | null;
  /** Bấm vào dòng mở được trang bộ; bộ đã xóa thì không (chỉ Khôi phục). */
  openable: boolean;
}

/**
 * Giáo viên: bộ đã xóa chỉ có Khôi phục (UC-BT-08); bộ Nháp có Xuất bản, Xóa; bộ Đã xuất bản có Gỡ xuất bản, Xóa.
 * Quản trị viên chỉ có Gỡ xuất bản (UC-BT-06), không Sửa, Xóa, Khôi phục (AC-BT-63).
 */
export function deckActions(deck: DeckActionInput, role: ManageRole): DeckActionsResult {
  const deletedAt = deck.deletedAt ?? null;
  if (role === "admin") {
    const actions: DeckAction[] = deck.status === "published" && !deletedAt ? ["unpublish"] : [];
    return { actions, deletedAt: null, openable: !deletedAt };
  }
  if (deletedAt) return { actions: ["restore"], deletedAt, openable: false };
  const toggle: DeckAction = deck.status === "draft" ? "publish" : "unpublish";
  return { actions: [toggle, "delete"], deletedAt: null, openable: true };
}
