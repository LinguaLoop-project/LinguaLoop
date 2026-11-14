import { useParams } from "react-router-dom";
import DeckDetailView from "../../components/manage/DeckDetailView";

/** Xem chi tiết bộ thẻ Đã xuất bản cho quản trị viên (UC-BT-04): chỉ xem và gỡ xuất bản. */
export default function AdminDeckDetailPage() {
  const { id = "" } = useParams();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <DeckDetailView key={id} role="admin" deckId={id} />
    </main>
  );
}
