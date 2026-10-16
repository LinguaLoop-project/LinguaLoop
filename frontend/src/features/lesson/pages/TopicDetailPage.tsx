import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { useLessonSearch, useTopicDetail } from "../hooks/useLessons";
import Breadcrumbs from "../components/Breadcrumbs";
import { LessonGrid, LessonGridSkeleton } from "../components/LessonGrid";
import QueryError from "../components/QueryError";
import type { LessonState } from "../types";
import { difficultyParam, localizedName } from "../utils";

const PAGE_STEP = 24;

const BackToLibrary = () => {
  const { t } = useTranslation("pages");
  return (
    <Link to="/student/lessons">
      <Button variant="secondary">{t("student.lessonDetail.backToLibrary", "Quay lại Thư viện")}</Button>
    </Link>
  );
};

export const TopicDetailPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation("pages");
  const isEn = i18n.language === "en";

  const [levelFilter, setLevelFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [pageSize, setPageSize] = useState(PAGE_STEP);

  const topicQuery = useTopicDetail(slug);
  const lessonsQuery = useLessonSearch({
    topic: slug,
    difficulty: difficultyParam(levelFilter),
    state: stateFilter === "all" ? undefined : (stateFilter as LessonState),
    size: pageSize,
  });

  const topic = topicQuery.data?.topic;
  const lessons = useMemo(() => lessonsQuery.data?.items ?? [], [lessonsQuery.data]);
  // Số bài khớp bộ lọc dùng cho "đang hiện" và "xem thêm"; tiến độ chủ đề tính trên toàn bộ bài của chủ đề.
  const matchedCount = lessonsQuery.data?.totalElements ?? 0;
  const totalCount = topic?.totalLessons ?? 0;
  const doneCount = topic?.completedLessons ?? 0;

  if (topicQuery.isLoading) {
    return (
      <section className="w-full" aria-busy="true">
        <Skeleton className="mb-4 h-4 w-48" />
        <div className="mb-7 flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
        <LessonGridSkeleton />
      </section>
    );
  }

  if (topicQuery.isError || !topic) {
    return (
      <div className="py-10">
        <QueryError
          error={topicQuery.error}
          kind={topicQuery.error ? undefined : "notFound"}
          onRetry={() => void topicQuery.refetch()}
          retrying={topicQuery.isFetching}
          action={<BackToLibrary />}
        />
      </div>
    );
  }

  const name = localizedName(isEn, topic, slug);
  const secondaryName = isEn ? topic.name : topic.nameVi;
  const filteredOut = levelFilter !== "all" || stateFilter !== "all";

  return (
    <section className="w-full" id="v-topic">
      <div id="tpHead" className="mb-6">
        <Breadcrumbs items={[{ label: t("student.lessons.title", "Bài học"), to: "/student/lessons" }, { label: name }]} />

        <div className="relative mb-7 mt-2 flex flex-wrap items-center gap-6">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-border bg-primary-soft">
            <Icon name={topic.icon} fallback="library" className="text-[40px] text-primary-text" />
          </div>

          <div className="min-w-[280px] flex-1">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-text">
              {t("student.topicDetail.topicPrefix", "Chủ đề")}
              {secondaryName ? ` · ${secondaryName}` : ""}
            </div>
            <h1 className="font-display text-2xl font-extrabold text-text sm:text-3xl">{name}</h1>
          </div>

          <div className="min-w-[240px] rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{t("student.topicDetail.completedLabel", "Bạn đã hoàn thành")}</span>
              <b className="font-semibold text-text">
                {t("student.topicDetail.completedCount", { done: doneCount, total: totalCount, defaultValue: `${doneCount}/${totalCount} bài` })}
              </b>
            </div>
            <ProgressBar
              value={totalCount ? (doneCount / totalCount) * 100 : 0}
              label={t("student.topicDetail.completedLabel", "Bạn đã hoàn thành")}
              className="mt-2.5 h-2"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SegmentedControl
          ariaLabel={t("student.topicDetail.levels.label", "Trình độ")}
          value={levelFilter}
          onChange={setLevelFilter}
          options={[
            { value: "all", label: t("student.topicDetail.levels.all", "Mọi trình độ") },
            { value: "basic", label: "A1–A2" },
            { value: "mid", label: "B1–B2" },
            { value: "adv", label: "C1–C2" },
          ]}
        />
        <SegmentedControl
          ariaLabel={t("student.topicDetail.states.label", "Trạng thái")}
          value={stateFilter}
          onChange={setStateFilter}
          options={[
            { value: "all", label: t("student.topicDetail.states.all", "Tất cả") },
            { value: "todo", label: t("student.topicDetail.states.todo", "Chưa học") },
            { value: "doing", label: t("student.topicDetail.states.doing", "Đang học") },
            { value: "done", label: t("student.topicDetail.states.done", "Đã xong") },
          ]}
        />
        <span className="flex-1" />
        <span className="text-xs text-text-muted" id="tpCount">
          {t("student.topicDetail.showingCount", {
            count: lessons.length,
            total: matchedCount,
            defaultValue: `Đang hiện ${lessons.length} / ${matchedCount} bài`,
          })}
        </span>
      </div>

      {lessonsQuery.isError ? (
        <QueryError error={lessonsQuery.error} onRetry={() => void lessonsQuery.refetch()} retrying={lessonsQuery.isFetching} />
      ) : lessonsQuery.isLoading ? (
        <LessonGridSkeleton count={8} />
      ) : lessons.length > 0 ? (
        <LessonGrid id="tpGrid" lessons={lessons} />
      ) : filteredOut ? (
        <EmptyState
          title={t("student.topicDetail.empty.title", "Chưa có bài nào ở mục này")}
          description={t("student.topicDetail.empty.desc", "Đổi trình độ hoặc trạng thái để xem thêm bài.")}
        />
      ) : (
        <EmptyState title={t("student.topicDetail.noLessons.title", "Chủ đề này chưa có bài")}>
          <BackToLibrary />
        </EmptyState>
      )}

      {lessons.length < matchedCount && (
        <div className="mt-8 text-center" id="tpMore">
          <Button
            variant="ghost"
            onClick={() => setPageSize((prev) => prev + PAGE_STEP)}
            isLoading={lessonsQuery.isFetching}
            rightIcon={<Icon name="chevron-down" />}
          >
            {t("student.topicDetail.loadMore", { count: matchedCount - lessons.length, defaultValue: `Xem thêm ${matchedCount - lessons.length} bài` })}
          </Button>
        </div>
      )}
    </section>
  );
};
