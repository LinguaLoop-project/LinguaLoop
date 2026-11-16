import { useLocation, useParams } from "react-router-dom";
import DeckDetailView from "../../components/manage/DeckDetailView";

/** Nơi mở trang bộ, do trang trước gửi qua `state` của điều hướng (ví dụ yêu cầu duyệt xuất bản lại, UC-XL-05). */
function backOf(state: unknown): { path: string; label: string } | undefined {
  if (typeof state !== "object" || state === null) return undefined;
  const { backTo, backLabel } = state as { backTo?: unknown; backLabel?: unknown };
  return typeof backTo === "string" && typeof backLabel === "string" ? { path: backTo, label: backLabel } : undefined;
}

/**
 * Xem chi tiết bộ thẻ cho quản trị viên (UC-BT-04): chỉ xem và gỡ xuất bản. Mở từ yêu cầu duyệt xuất bản lại thì nút
 * quay lại trỏ về yêu cầu đó.
 */
export default function AdminDeckDetailPage() {
  const { id = "" } = useParams();
  const back = backOf(useLocation().state);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <DeckDetailView key={id} role="admin" deckId={id} back={back} />
    </main>
  );
}
