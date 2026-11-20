import { useParams } from "react-router-dom";
import LessonDetailView from "../../manage/components/LessonDetailView";

/** Chi tiết bài học của giáo viên (UC-BH-02); cũng là màn mở ra sau khi tạo bài (UC-BH-03 Bước 9). */
export default function TeacherLessonDetailPage() {
  const { id = "" } = useParams();
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-6">
      <LessonDetailView key={id} role="teacher" lessonId={id} />
    </main>
  );
}
