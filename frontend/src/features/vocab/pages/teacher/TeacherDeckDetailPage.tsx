import { useParams } from "react-router-dom";
import DeckDetailView from "../../components/manage/DeckDetailView";

/** Xem chi tiết bộ thẻ của giáo viên (UC-BT-04); cũng là màn quản lý bộ sau khi tạo (UC-BT-02 bước 6). */
export default function TeacherDeckDetailPage() {
  const { id = "" } = useParams();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <DeckDetailView key={id} role="teacher" deckId={id} />
    </main>
  );
}
