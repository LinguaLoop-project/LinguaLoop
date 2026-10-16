import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import type { MascotMood } from "@/components/common/Mascot";
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
      <Button variant="ghost">{t("student.lessonDetail.backToLibrary", "Về thư viện bài học")}</Button>
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
        <div className="mb-6 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-5 lg:grid-cols-[72px_minmax(0,1fr)_280px]">
          <Skeleton className="h-[72px] w-[72px] rounded-lg" />
          <div>
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-9 w-72" />
          </div>
        </div>
        <LessonGridSkeleton />
      </section>
    );
  }

  if (topicQuery.isError || !topic) {
    return (
      <div className="py-6">
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
  const secondaryName = isEn ? topic.nameVi : topic.name;
  const filteredOut = levelFilter !== "all" || stateFilter !== "all";
  const ratio = totalCount ? doneCount / totalCount : 0;
  const mood: [MascotMood, string] =
    ratio > 0.5
      ? ["celebrate", t("student.topicDetail.say.almost", "Bạn gần xong chủ đề này rồi!")]
      : doneCount
        ? ["correct", t("student.topicDetail.say.going", "Tiếp tục nhé, đang tiến bộ đấy!")]
        : ["hello", t("student.topicDetail.say.start", "Chọn một bài để bắt đầu nào!")];

  return (
    <section className="w-full" id="v-topic">
      <div id="tpHead">
        <Breadcrumbs items={[{ label: t("student.lessons.title", "Bài học"), to: "/student/lessons" }, { label: name }]} />

        <div className="mb-6 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-5 lg:grid-cols-[72px_minmax(0,1fr)_280px]">
          <div className="grid h-[72px] w-[72px] place-items-center rounded-lg bg-primary-soft text-primary-text">
            <Icon name={topic.icon} fallback="library" className="h-9 w-9" />
          </div>

          <div className="min-w-0">
            <div className="mb-1 text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">
              {t("student.topicDetail.topicPrefix", "Chủ đề")}
              {secondaryName ? ` · ${secondaryName}` : ""}
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{name}</h1>
            <LoopiSay mood={mood[0]} text={mood[1]} className="mt-4" />
          </div>

          <div className="col-span-full rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] lg:col-span-1">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-muted">{t("student.topicDetail.completedLabel", "Bạn đã hoàn thành")}</span>
              <b>{t("student.topicDetail.completedCount", { done: doneCount, total: totalCount, defaultValue: `${doneCount}/${totalCount} bài` })}</b>
            </div>
            <ProgressBar value={ratio * 100} label={t("student.topicDetail.completedLabel", "Bạn đã hoàn thành")} className="mt-2" />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SegmentedControl
          ariaLabel={t("student.topicDetail.levels.label", "Trình độ")}
          value={levelFilter}
          onChange={setLevelFilter}
          options={[
            { value: "all", label: t("student.topicDetail.levels.all", "Tất cả") },
            { value: "basic", label: t("student.lessons.toolbar.levels.basic", "Cơ bản (A1–A2)") },
            { value: "mid", label: t("student.lessons.toolbar.levels.mid", "Trung cấp (B1–B2)") },
            { value: "adv", label: t("student.lessons.toolbar.levels.adv", "Nâng cao (C1–C2)") },
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
        <span className="text-[13px] leading-normal text-text-muted" id="tpCount">
          {t("student.topicDetail.showingCount", { count: lessons.length, total: matchedCount, defaultValue: `Đang hiện ${lessons.length} / ${matchedCount} bài` })}
        </span>
      </div>

      {lessonsQuery.isError ? (
        <QueryError error={lessonsQuery.error} onRetry={() => void lessonsQuery.refetch()} retrying={lessonsQuery.isFetching} />
      ) : lessonsQuery.isLoading ? (
        <LessonGridSkeleton count={8} />
      ) : lessons.length > 0 ? (
        <LessonGrid id="tpGrid" lessons={lessons} />
      ) : filteredOut ? (
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <img src="/mascot/loopi-encourage.svg" alt="" width={120} height={120} className="mb-3 select-none" draggable={false} />
          <h3 className="text-lg font-bold">{t("student.topicDetail.empty.title", "Chưa có bài nào ở mục này")}</h3>
          <p className="mt-1 text-[13px] leading-normal text-text-muted">{t("student.topicDetail.empty.desc", "Đổi trình độ hoặc trạng thái để xem thêm bài.")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]">
          <img src="/mascot/loopi-hello.svg" alt="" width={112} height={112} className="select-none" draggable={false} />
          <h2 className="mt-2 font-display text-2xl font-bold">{t("student.topicDetail.noLessons.title", "Chủ đề này chưa có bài")}</h2>
          <p className="mt-2 max-w-md text-text-muted">{t("student.topicDetail.noLessons.desc", "Bài học mới đang được biên tập. Hãy xem các chủ đề khác trong lúc chờ.")}</p>
          <div className="mt-6">
            <Link to="/student/lessons">
              <Button>{t("student.topicDetail.noLessons.action", "Xem các chủ đề khác")}</Button>
            </Link>
          </div>
        </div>
      )}

      {lessons.length < matchedCount && (
        <div className="mt-8 text-center" id="tpMore">
          <Button variant="ghost" onClick={() => setPageSize((prev) => prev + PAGE_STEP)} isLoading={lessonsQuery.isFetching}>
            {t("student.topicDetail.loadMore", { count: matchedCount - lessons.length, defaultValue: `Xem thêm ${matchedCount - lessons.length} bài` })}
            <Icon name="chevron-down" className="text-xl" />
          </Button>
        </div>
      )}
    </section>
  );
};
