import { useParams } from "react-router-dom";
import { TakedownNotice, useIsTakenDown } from "@/features/report";
import DeckDetailView from "../../components/manage/DeckDetailView";
import { useDeckDetail } from "../../deckManageHooks";

/** Xem chi tiết bộ thẻ của giáo viên (UC-BT-04); cũng là màn quản lý bộ sau khi tạo (UC-BT-02 bước 6). */
export default function TeacherDeckDetailPage() {
  const { id = "" } = useParams();
  const takenDown = useIsTakenDown("deck", id || undefined);
  // Cùng truy vấn với DeckDetailView; mốc cập nhật đổi sau mỗi lần sửa thẻ (BR-NT-06) để khung bị gỡ tải lại.
  const updatedAt = useDeckDetail("teacher", id || undefined).data?.updatedAt;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      {/* Bộ bị gỡ do báo cáo: lý do và nút gửi yêu cầu duyệt xuất bản lại (UC-BT-05 nhánh 2b). */}
      {id && <TakedownNotice targetType="deck" targetId={id} contentVersion={updatedAt} />}
      {/* Khung trên đã nêu lý do gỡ, nên không lặp lại dòng "Quản trị viên đã gỡ xuất bản". */}
      <DeckDetailView key={id} role="teacher" deckId={id} hideUnpublishReason={takenDown} />
    </main>
  );
}
