import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import QueryError from "@/features/lesson/components/QueryError";
import { useLessonDetail, useLessonSentences } from "@/features/lesson/hooks/useLessons";
import { useQuota } from "@/hooks/useQuota";
import ShadowingPractice from "../components/ShadowingPractice";
import { useLatestAttempts } from "../hooks/useShadowing";

const K = "student.shadowingPractice";

/** Cùng bố cục hai cột của trang thật để chuyển trạng thái không nhảy. */
const PracticeSkeleton = () => (
  <section className="w-full" aria-busy="true">
    <Skeleton className="mb-2 h-4 w-48" />
    <Skeleton className="mb-6 h-8 w-72" />
    <div className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  </section>
);

/** Trang luyện shadowing của một bài: `/student/shadowing/:slug`. */
export default function ShadowingPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t } = useTranslation("pages");
  const { setShowUpgradeModal } = useQuota();

  const lessonQuery = useLessonDetail(slug);
  const lesson = lessonQuery.data;
  // Bài Pro bị khoá thì không gọi các API còn lại (sẽ trả 403 LESSON_PRO_REQUIRED)
  const openSlug = lesson && !lesson.locked ? lesson.slug : undefined;
  const sentencesQuery = useLessonSentences(openSlug);
  const latestQuery = useLatestAttempts(openSlug);

  const backToLibrary = (
    <Link to="/student/shadowing">
      <Button variant="ghost">{t(`${K}.locked.back`)}</Button>
    </Link>
  );

  if (lessonQuery.isLoading) return <PracticeSkeleton />;

  if (lessonQuery.isError || !lesson) {
    return (
      <div className="py-6">
        <QueryError
          error={lessonQuery.error}
          kind={lessonQuery.error ? undefined : "notFound"}
          onRetry={() => void lessonQuery.refetch()}
          retrying={lessonQuery.isFetching}
          action={backToLibrary}
        />
      </div>
    );
  }

  if (lesson.locked) {
    return (
      <div className="py-6">
        <EmptyState
          icon="crown"
          mascotSrc=""
          title={t(`${K}.locked.title`)}
          description={t(`${K}.locked.body`)}
          className="mx-auto max-w-md"
        >
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => setShowUpgradeModal(true)} leftIcon={<Icon name="crown" />}>
              {t(`${K}.locked.upgrade`)}
            </Button>
            {backToLibrary}
          </div>
        </EmptyState>
      </div>
    );
  }

  const failed = sentencesQuery.isError ? sentencesQuery : latestQuery.isError ? latestQuery : null;
  if (failed) {
    return (
      <div className="py-6">
        <QueryError
          error={failed.error}
          onRetry={() => void failed.refetch()}
          retrying={failed.isFetching}
          action={backToLibrary}
        />
      </div>
    );
  }

  if (sentencesQuery.isLoading || latestQuery.isLoading || !sentencesQuery.data || !latestQuery.data) {
    return <PracticeSkeleton />;
  }

  if (sentencesQuery.data.length === 0) {
    return (
      <div className="py-6">
        <QueryError error={null} kind="notFound" action={backToLibrary} />
      </div>
    );
  }

  return <ShadowingPractice key={lesson.id} lesson={lesson} sentences={sentencesQuery.data} latest={latestQuery.data} />;
}
