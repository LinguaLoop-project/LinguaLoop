import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { LessonAction } from "../../manage/actions";
import CreatingLessons from "../../manage/components/CreatingLessons";
import LessonActionDialog from "../../manage/components/LessonActionDialog";
import LessonCreateCard from "../../manage/components/LessonCreateCard";
import LessonManageList from "../../manage/components/LessonManageList";
import { useLessonList, useLessonTopics } from "../../manage/hooks";
import { TEACHER_LESSONS_PATH } from "../../manage/paths";
import {
  DEFAULT_FILTER,
  type CreateLessonInput,
  type LessonApiError,
  type LessonItem,
  type LessonListFilter,
} from "../../manage/types";

/**
 * Bài học của giáo viên: thẻ tạo bài từ YouTube (UC-BH-03) ở đầu trang, các bài đang tạo, rồi danh sách bài (UC-BH-01);
 * xuất bản, gỡ, xóa, khôi phục ngay trên danh sách (UC-BH-06 đến 09).
 */
export default function TeacherLessonListPage() {
  const { t } = useTranslation("lessonManage");
  const navigate = useNavigate();
  const [filter, setFilter] = useState<LessonListFilter>(DEFAULT_FILTER);
  const [page, setPage] = useState(0);
  const query = useLessonList("teacher", filter, page);
  const topics = useLessonTopics();
  const [pending, setPending] = useState<{ action: LessonAction; lesson: LessonItem } | null>(null);
  // Đổi `prefill.version` để dựng lại thẻ tạo bài với dữ liệu của lượt lỗi cần sửa.
  const [prefill, setPrefill] = useState<{ input: CreateLessonInput | null; version: number }>({ input: null, version: 0 });
  const linkRef = useRef<HTMLInputElement>(null);

  const focusCreate = () => {
    linkRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    linkRef.current?.focus({ preventScroll: true });
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <h1 className="text-2xl font-bold text-text">{t("list.title")}</h1>
      <LessonCreateCard
        key={prefill.version}
        topics={topics.data ?? []}
        initial={prefill.input}
        linkRef={linkRef}
      />
      <CreatingLessons
        onEdit={(input) => {
          setPrefill((p) => ({ input, version: p.version + 1 }));
          requestAnimationFrame(focusCreate);
        }}
      />
      <LessonManageList
        role="teacher"
        filter={filter}
        onFilterChange={(next) => {
          setFilter(next);
          setPage(0);
        }}
        page={page}
        onPageChange={setPage}
        data={query.data}
        isLoading={query.isLoading}
        error={query.isError ? (query.error as unknown as LessonApiError) : null}
        onRetry={() => void query.refetch()}
        topics={topics.data ?? []}
        onCreate={focusCreate}
        onOpen={(lesson) => navigate(`${TEACHER_LESSONS_PATH}/${lesson.id}`)}
        onAction={(action, lesson) => setPending({ action, lesson })}
        onStats={(lesson) => navigate(`${TEACHER_LESSONS_PATH}/${lesson.id}/stats`)}
      />
      {pending && (
        <LessonActionDialog
          role="teacher"
          action={pending.action}
          lesson={pending.lesson}
          onClose={() => setPending(null)}
          onEditSentences={(id) => navigate(`${TEACHER_LESSONS_PATH}/${id}`)}
        />
      )}
    </main>
  );
}
