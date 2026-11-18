import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { LessonAction } from "../../manage/actions";
import LessonActionDialog from "../../manage/components/LessonActionDialog";
import LessonManageList from "../../manage/components/LessonManageList";
import { useLessonList, useLessonTopics } from "../../manage/hooks";
import { ADMIN_LESSONS_PATH } from "../../manage/paths";
import {
  DEFAULT_FILTER,
  type LessonApiError,
  type LessonItem,
  type LessonListFilter,
  type TopicOption,
} from "../../manage/types";

/**
 * Bài Đã xuất bản của mọi giáo viên cho quản trị viên (UC-BH-01, BR-BH-02): lọc theo giáo viên chủ bài, gỡ xuất bản kèm
 * lý do (UC-BH-07). Lựa chọn lọc giáo viên lấy từ các bài đang hiển thị.
 */
export default function AdminLessonListPage() {
  const { t } = useTranslation("lessonManage");
  const navigate = useNavigate();
  const [filter, setFilter] = useState<LessonListFilter>(DEFAULT_FILTER);
  const [page, setPage] = useState(0);
  const query = useLessonList("admin", filter, page);
  const topics = useLessonTopics();
  const [pending, setPending] = useState<{ action: LessonAction; lesson: LessonItem } | null>(null);
  const items = query.data?.items;
  const owners = useMemo<TopicOption[]>(() => {
    const byId = new Map<string, string>();
    for (const item of items ?? []) if (item.ownerName) byId.set(item.ownerId, item.ownerName);
    return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <h1 className="text-2xl font-bold text-text">{t("list.adminTitle")}</h1>
      <LessonManageList
        role="admin"
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
        owners={owners}
        onOpen={(lesson) => navigate(`${ADMIN_LESSONS_PATH}/${lesson.id}`)}
        onAction={(action, lesson) => setPending({ action, lesson })}
      />
      {pending && (
        <LessonActionDialog
          role="admin"
          action={pending.action}
          lesson={pending.lesson}
          onClose={() => setPending(null)}
        />
      )}
    </main>
  );
}
