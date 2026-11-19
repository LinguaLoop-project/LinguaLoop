// "Bộ của tôi" (UC-HT-08): kiểu dữ liệu và luật kiểm tên ở trình duyệt. Máy chủ kiểm lại theo BR-HT-25.
import { validateDeckName, type NameError } from "./createDeckForm";
import type { DeckApiError } from "./deckManageTypes";

/** Một bộ từ cá nhân của người học (`MyDeckView`). */
export interface MyDeck {
  id: string;
  name: string;
  /** Số thẻ của bộ. */
  cardCount: number;
  /** Số thẻ của bộ đang đến hạn ôn. */
  dueCount: number;
  createdAt: string | null;
}

export type MyDeckNameError = NameError;

/** Tên 1 đến 100 ký tự sau khi cắt khoảng trắng hai đầu (BR-HT-25); trùng tên chỉ máy chủ biết. */
export const validateMyDeckName = (name: string): MyDeckNameError | null => validateDeckName(name);

/** Kết quả một lần lưu hoặc xóa thất bại, để hộp thoại biết gắn lỗi vào ô hay đóng hộp. */
export type MyDeckFailure =
  | { kind: "name"; error: MyDeckNameError }
  /** Bộ không còn (xóa ở nơi khác) hoặc không phải của người học: tải lại danh sách. */
  | { kind: "gone" }
  | { kind: "forbidden" }
  /** Mất kết nối hoặc lỗi máy chủ: giữ nguyên tên đã nhập để thử lại (luồng lỗi mạng). */
  | { kind: "retry" };

export function myDeckFailure(error: DeckApiError): MyDeckFailure {
  if (error.kind === "conflict") return { kind: "name", error: "Duplicate" };
  if (error.kind === "validation") {
    const name = error.fieldErrors.find((item) => item.field === "name");
    if (name) return { kind: "name", error: name.code === "Size" ? "Size" : "NotBlank" };
    return { kind: "retry" };
  }
  if (error.kind === "notFound") return { kind: "gone" };
  if (error.kind === "forbidden") return { kind: "forbidden" };
  return { kind: "retry" };
}

/** Bộ mới tạo xếp trước; dùng khi cập nhật danh sách tại chỗ. */
export function sortMyDecks(decks: readonly MyDeck[]): MyDeck[] {
  return [...decks].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
