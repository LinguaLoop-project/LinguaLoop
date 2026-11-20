import { useParams } from "react-router-dom";
import LessonDetailView from "../../manage/components/LessonDetailView";

/** Chi tiết bài Đã xuất bản cho quản trị viên (UC-BH-02); chỉ có nút Gỡ xuất bản (BR-BH-02). */
export default function AdminLessonDetailPage() {
  const { id = "" } = useParams();
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-6">
      <LessonDetailView key={id} role="admin" lessonId={id} />
    </main>
  );
}
