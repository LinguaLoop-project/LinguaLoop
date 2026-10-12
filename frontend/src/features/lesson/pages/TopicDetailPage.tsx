import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTopicDetail, useLessonSearch } from "../hooks/useLessons";
import type { LessonState } from "../types";
import { LessonCard } from "../components/LessonCard";
import SegmentedControl from "../../../components/common/SegmentedControl";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";

export const TopicDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const topicSlug = slug || "";
  const { t, i18n } = useTranslation(["pages", "common", "layout"]);

  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(24);

  const { data: topicRow, isLoading: isTopicLoading } =
    useTopicDetail(topicSlug);

  const topic = topicRow?.topic;

  const getDifficulty = (lvl: string) => {
    if (lvl === "basic") return "A1,A2";
    if (lvl === "mid") return "B1,B2";
    if (lvl === "adv") return "C1,C2";
    return undefined;
  };

  const { data: searchResults, isLoading: isLessonsLoading } = useLessonSearch({
    topic: topicSlug,
    difficulty: getDifficulty(levelFilter),
    state: stateFilter === "all" ? undefined : (stateFilter as LessonState),
    size: pageSize,
  });

  const lessons = useMemo(() => searchResults?.items ?? [], [searchResults]);

  // Số bài khớp bộ lọc (dùng cho "đang hiện" và "xem thêm"); tiến độ chủ đề tính trên toàn bộ bài của chủ đề.
  const matchedCount = searchResults?.totalElements ?? 0;
  const totalCount = topic?.totalLessons ?? 0;
  const doneN = topic?.completedLessons ?? 0;

  const handleLoadMore = () => {
    setPageSize((prev) => prev + 24);
  };

  if (isTopicLoading) {
    return (
      <div className="flex justify-center p-12">
        <i className="ph ph-circle-notch text-3xl animate-spin text-primary"></i>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="py-16">
        <EmptyState
          mascotSrc="/mascot/loopi-encourage.svg"
          title={t(
            "pages:student.topicDetail.notFoundTitle",
            "Không tìm thấy chủ đề",
          )}
          description={t(
            "pages:student.topicDetail.notFoundDesc",
            "Chủ đề bạn đang tìm không tồn tại hoặc chưa được công khai.",
          )}
        >
          <Link to="/student/lessons">
            <Button variant="primary">
              {t("pages:student.lessonDetail.backToLibrary", "Quay lại Thư viện")}
            </Button>
          </Link>
        </EmptyState>
      </div>
    );
  }

  const isEn = i18n.language === "en";
  const topicDisplayName = isEn
    ? topic?.name || topic?.nameVi || topicSlug
    : topic?.nameVi || topic?.name || topicSlug;
  const topicSecondaryName = isEn ? topic?.name : topic?.nameVi;

  return (
    <section className="w-full" id="v-topic">
      {/* ── Breadcrumb & Topic Hero ── */}
      <div id="tpHead" className="mb-6">
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-text-muted mb-4 [&>a]:text-text-muted [&>a]:min-h-8 [&>a]:inline-flex [&>a]:items-center hover:[&>a]:text-text hover:[&>a]:underline [&>i]:text-[14px]">
          <Link to="/student/lessons">
            {t("pages:student.lessons.title", "Bài học")}
          </Link>
          <i className="ph ph-caret-right"></i>
          <span>{topicDisplayName}</span>
        </div>

        <div className="relative flex flex-wrap items-center gap-6 my-2 mb-7">
          <div className="relative w-24 h-24 shrink-0 grid place-items-center">
            <svg
              viewBox="0 0 200 200"
              aria-hidden="true"
              className="absolute inset-0 w-full h-full"
            >
              <use href="#o-orb" />
            </svg>
            <i
              className={`ph-duotone ph-${topic.icon || "books"} relative text-[40px] text-accent`}
              aria-hidden="true"
            ></i>
          </div>

          <div className="flex-1 min-w-[280px]">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-accent mb-1">
              {t("pages:student.topicDetail.topicPrefix", "Chủ đề")}
              {topicSecondaryName ? ` · ${topicSecondaryName}` : ""}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text font-display">
              {topicDisplayName}
            </h1>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border shadow-[var(--shadow-card)] min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>
                {t(
                  "pages:student.topicDetail.completedLabel",
                  "Bạn đã hoàn thành",
                )}
              </span>
              <b className="font-semibold text-text">
                {t("pages:student.topicDetail.completedCount", {
                  done: doneN,
                  total: totalCount,
                  defaultValue: `${doneN}/${totalCount} bài`,
                })}
              </b>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden mt-2.5">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-500 ease-out"
                style={{
                  width: `${totalCount ? Math.min(100, Math.round((doneN / totalCount) * 100)) : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Level & State Filter ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Level segment */}
        <SegmentedControl
          ariaLabel={t("pages:student.topicDetail.levels.label", "Trình độ")}
          value={levelFilter}
          onChange={setLevelFilter}
          options={[
            {
              value: "all",
              label: t("pages:student.topicDetail.levels.all", "Mọi trình độ"),
            },
            { value: "basic", label: "A1–A2" },
            { value: "mid", label: "B1–B2" },
            { value: "adv", label: "C1–C2" },
          ]}
        />

        {/* State segment */}
        <SegmentedControl
          ariaLabel={t("pages:student.topicDetail.states.label", "Trạng thái")}
          value={stateFilter}
          onChange={setStateFilter}
          options={[
            {
              value: "all",
              label: t("pages:student.topicDetail.states.all", "Tất cả"),
            },
            {
              value: "todo",
              label: t("pages:student.topicDetail.states.todo", "Chưa học"),
            },
            {
              value: "doing",
              label: t("pages:student.topicDetail.states.doing", "Đang học"),
            },
            {
              value: "done",
              label: t("pages:student.topicDetail.states.done", "Đã xong"),
            },
          ]}
        />

        <span className="flex-1"></span>
        <span className="text-xs text-text-muted" id="tpCount">
          {t("pages:student.topicDetail.showingCount", {
            count: lessons.length,
            total: matchedCount,
            defaultValue: `Đang hiện ${lessons.length} / ${matchedCount} bài`,
          })}
        </span>
      </div>

      {/* ── Grid of lessons ── */}
      {isLessonsLoading && lessons.length === 0 ? (
        <div className="flex justify-center p-12">
          <i className="ph ph-circle-notch text-3xl animate-spin text-primary"></i>
        </div>
      ) : lessons.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
          id="tpGrid"
        >
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t(
            "pages:student.topicDetail.empty.title",
            "Chưa có bài nào ở mục này",
          )}
          description={t(
            "pages:student.topicDetail.empty.desc",
            "Đổi trình độ hoặc trạng thái để xem thêm bài.",
          )}
        />
      )}

      {/* ── Load more button ── */}
      {lessons.length < matchedCount && (
        <div className="text-center mt-8" id="tpMore">
          <Button
            variant="ghost"
            onClick={handleLoadMore}
            rightIcon={<i className="ph ph-caret-down"></i>}
          >
            {t("pages:student.topicDetail.loadMore", {
              count: matchedCount - lessons.length,
              defaultValue: `Xem thêm ${matchedCount - lessons.length} bài`,
            })}
          </Button>
        </div>
      )}
    </section>
  );
};
