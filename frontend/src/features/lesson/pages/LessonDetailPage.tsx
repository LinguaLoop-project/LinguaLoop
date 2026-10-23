import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import { useLessonDetail, useLessonSentences } from "../hooks/useLessons";
import Breadcrumbs from "../components/Breadcrumbs";
import QueryError from "../components/QueryError";
import { NotesCard, ProgressCard, RelatedLessons, VocabCard } from "../components/detail/AsideCards";
import LessonHead from "../components/detail/LessonHead";
import PracticeModeCard from "../components/detail/PracticeModeCard";
import TranscriptList from "../components/detail/TranscriptList";
import type { PracticeMode } from "../components/ModeButton";
import { localizedName } from "../utils";

const BackToLibrary = () => {
  const { t } = useTranslation("pages");
  return (
    <Link to="/student/lessons">
      <Button variant="ghost">{t("student.lessonDetail.backToLibrary", "Về thư viện bài học")}</Button>
    </Link>
  );
};

/** Skeleton cùng bố cục hai cột của trang thật (`lessonSkeleton` của mockup). */
const DetailSkeleton = () => (
  <section className="w-full" aria-busy="true">
    <Skeleton className="mb-4 h-4 w-64" />
    <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-6">
        <div className="grid items-center gap-6 rounded-lg border border-border bg-surface p-5 md:grid-cols-[260px_1fr]">
          <Skeleton className="h-[164px] rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-[34px] w-[85%]" />
            <Skeleton className="h-4 w-[45%]" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
              <Skeleton className="h-12 w-12 rounded-md" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3.5 w-[90%]" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-5 w-[35%]" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-[88px] w-full rounded-md" />
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  </section>
);

/** Chế độ gợi ý (lesson.html): đang học dở (tiến độ cao hơn) > chưa học (ưu tiên nghe chép) > không gợi ý nếu cả hai đã xong. */
function recommendedMode(d: number, s: number): PracticeMode | null {
  const doing = (["dictation", "shadowing"] as const)
    .filter((m) => {
      const p = m === "dictation" ? d : s;
      return p > 0 && p < 100;
    })
    .sort((a, b) => (b === "dictation" ? d : s) - (a === "dictation" ? d : s));
  if (doing[0]) return doing[0];
  const todo = (["dictation", "shadowing"] as const).filter((m) => (m === "dictation" ? d : s) === 0);
  return todo.length === 2 ? "dictation" : (todo[0] ?? null);
}

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
      <div className="py-6">
        {/* 404: QueryError tự bỏ nút Thử lại, chỉ còn "Về thư viện bài học" */}
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
  const isEn = i18n.language === "en";
  const topicName = localizedName(isEn, lesson.topic, isEn ? "Topic" : "Chủ đề");
  const { dictationPercent: d, shadowingPercent: s } = lesson.progress;
  const rec = recommendedMode(d, s);

  return (
    <section className="w-full" id="v-lesson">
      <Breadcrumbs
        items={[
          { label: t("student.lessons.title", "Bài học"), to: "/student/lessons" },
          { label: topicName, to: topicSlug ? `/student/topics/${topicSlug}` : undefined },
          { label: lesson.title },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <LessonHead lesson={lesson} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PracticeModeCard mode="dictation" slug={lesson.slug} sentenceCount={lesson.sentenceCount} percent={d} recommended={rec === "dictation"} locked={lesson.locked} />
            <PracticeModeCard mode="shadowing" slug={lesson.slug} sentenceCount={lesson.sentenceCount} percent={s} recommended={rec === "shadowing"} locked={lesson.locked} />
          </div>

          <TranscriptList
            sentences={sentencesQuery.data ?? []}
            locked={lesson.locked}
            loading={sentencesQuery.isLoading}
            error={sentencesQuery.error}
            onRetry={() => void sentencesQuery.refetch()}
            retrying={sentencesQuery.isFetching}
            started={d > 0}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <ProgressCard progress={lesson.progress} />
          <VocabCard />
          <NotesCard slug={lesson.slug} locked={lesson.locked} />
          <RelatedLessons lessons={lesson.relatedLessons ?? []} topicSlug={topicSlug} />
        </aside>
      </div>
    </section>
  );
};
