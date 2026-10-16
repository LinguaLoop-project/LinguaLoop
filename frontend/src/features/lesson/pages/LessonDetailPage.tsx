import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import { useLessonDetail, useLessonSentences } from "../hooks/useLessons";
import Breadcrumbs from "../components/Breadcrumbs";
import QueryError from "../components/QueryError";
import { NotesCard, ProgressCard, RelatedLessons, VocabCard } from "../components/detail/AsideCards";
import LessonInfo from "../components/detail/LessonInfo";
import LessonMedia from "../components/detail/LessonMedia";
import PracticeModeCard from "../components/detail/PracticeModeCard";
import TranscriptList from "../components/detail/TranscriptList";
import { localizedName } from "../utils";

const BackToLibrary = () => {
  const { t } = useTranslation("pages");
  return (
    <Link to="/student/lessons">
      <Button variant="secondary">{t("student.lessonDetail.backToLibrary", "Quay lại Thư viện")}</Button>
    </Link>
  );
};

/** Skeleton cùng bố cục hai cột của trang thật. */
const DetailSkeleton = () => (
  <section className="w-full" aria-busy="true">
    <Skeleton className="mb-4 h-4 w-64" />
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[7fr_5fr]">
      <div className="flex flex-col gap-6">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  </section>
);

export const LessonDetailPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation("pages");

  const lessonQuery = useLessonDetail(slug);
  const lesson = lessonQuery.data;

  // Bài Pro bị khoá thì không gọi /sentences (sẽ trả 403 LESSON_PRO_REQUIRED).
  const sentencesQuery = useLessonSentences(lesson && !lesson.locked ? lesson.slug : undefined);

  if (lessonQuery.isLoading) return <DetailSkeleton />;

  if (lessonQuery.isError || !lesson) {
    return (
      <div className="py-10">
        {/* 404: QueryError tự bỏ nút Thử lại, chỉ còn "Về thư viện" */}
        <QueryError
          error={lessonQuery.error}
          kind={lessonQuery.error ? undefined : "notFound"}
          onRetry={() => void lessonQuery.refetch()}
          retrying={lessonQuery.isFetching}
          action={<BackToLibrary />}
        />
      </div>
    );
  }

  const topicSlug = lesson.topic?.slug ?? "";
  const topicName = localizedName(i18n.language === "en", lesson.topic, i18n.language === "en" ? "Topic" : "Chủ đề");

  return (
    <section className="w-full" id="v-lesson">
      <Breadcrumbs
        items={[
          { label: t("student.lessons.title", "Bài học"), to: "/student/lessons" },
          { label: topicName, to: topicSlug ? `/student/topics/${topicSlug}` : undefined },
          { label: lesson.title },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[7fr_5fr]">
        <div className="flex flex-col gap-6">
          <LessonMedia lesson={lesson} />
          <LessonInfo lesson={lesson} topicName={topicName} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PracticeModeCard mode="dictation" slug={lesson.slug} sentenceCount={lesson.sentenceCount} percent={lesson.progress.dictationPercent} />
            <PracticeModeCard mode="shadowing" slug={lesson.slug} sentenceCount={lesson.sentenceCount} percent={lesson.progress.shadowingPercent} />
          </div>

          <TranscriptList
            sentences={sentencesQuery.data ?? []}
            locked={lesson.locked}
            loading={sentencesQuery.isLoading}
            error={sentencesQuery.error}
            onRetry={() => void sentencesQuery.refetch()}
            retrying={sentencesQuery.isFetching}
          />
        </div>

        <aside className="flex flex-col gap-6">
          <ProgressCard progress={lesson.progress} />
          <VocabCard />
          <NotesCard />
          <RelatedLessons lessons={lesson.relatedLessons ?? []} topicSlug={topicSlug} topicName={topicName} />
        </aside>
      </div>
    </section>
  );
};
