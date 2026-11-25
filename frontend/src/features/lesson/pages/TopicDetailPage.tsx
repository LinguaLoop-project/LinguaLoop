import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import type { MascotMood } from "@/components/common/Mascot";
import Pagination from "@/components/common/Pagination";
import ProgressBar from "@/components/common/ProgressBar";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import Breadcrumbs from "../components/Breadcrumbs";
import { LessonGrid, LessonGridSkeleton } from "../components/LessonGrid";
import QueryError from "../components/QueryError";
import SectionHeading from "../components/SectionHeading";
import LibraryToolbar from "../components/library/LibraryToolbar";
import TopicChips from "../components/library/TopicChips";
import { useLessonSearch, useTopicDetail, useTopicList } from "../hooks/useLessons";
import { useLibraryFilters, usePageClamp } from "../hooks/useLibraryFilters";
import { LIBRARY_PAGE_SIZES, SHORT_MAX_SEC } from "../libraryFilters";
import { nextMode } from "../savedUtils";
import type { LessonState } from "../types";
import { cefrLevelParam, isFiltered, localizedName, sortParam } from "../utils";

const BackToLibrary = () => {
  const { t } = useTranslation("pages");
  return (
    <Link to="/student/lessons">
      <Button variant="ghost">{t("student.lessonDetail.backToLibrary", "Về thư viện bài học")}</Button>
    </Link>
  );
};

export const TopicDetailPage = () => {
  const { id: slug = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("pages");
  const isEn = i18n.language === "en";

  const { filters, effectiveFilters, page, pageSize, setPage, handleFiltersChange, resetFilters, handlePageSizeChange } =
    useLibraryFilters({ withTopic: false });

  const goToPage = (p: number) => {
    setPage(p);
    document.getElementById("tpHead")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { data: topics = [] } = useTopicList();
  const topicQuery = useTopicDetail(slug);
  const lessonsQuery = useLessonSearch({
    topicId: slug,
    q: filters.search.trim() || undefined,
    cefrLevel: cefrLevelParam(filters.level),
    free: filters.freeOnly ? true : undefined,
    maxDuration: filters.shortOnly ? SHORT_MAX_SEC : undefined,
    state: filters.state === "all" ? undefined : (filters.state as LessonState),
    sort: sortParam(filters.sort),
    page,
    size: pageSize,
  });

  // Link có `?page=` vượt số trang thật (bài bị gỡ, bộ lọc đổi): lùi về trang cuối.
  const totalPages = lessonsQuery.data?.totalPages ?? 0;
  usePageClamp(page, totalPages, true, setPage);

  const topic = topicQuery.data?.topic;
  const lessons = useMemo(() => lessonsQuery.data?.items ?? [], [lessonsQuery.data]);
  const playableLessons = useMemo(() => lessons.filter((l) => !l.locked), [lessons]);
  const matchedCount = lessonsQuery.data?.totalElements ?? 0;
  const totalCount = topic?.totalLessons ?? 0;
  const doneCount = topic?.completedLessons ?? 0;

  const startRandom = () => {
    if (playableLessons.length === 0) return;
    const picked = playableLessons[Math.floor(Math.random() * playableLessons.length)];
    navigate(`/student/${nextMode(picked.progress)}/${picked.id}`);
  };

  if (topicQuery.isLoading) {
    return (
      <section className="w-full" aria-busy="true">
        <Skeleton className="mb-4 h-4 w-48" />
        <div className="mb-6 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-5 lg:grid-cols-[72px_minmax(0,1fr)_300px]">
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
  const secondaryName: string | null = null;
  const filteredOut = isFiltered(filters);
  const ratio = totalCount ? doneCount / totalCount : 0;
  const percentDone = Math.round(ratio * 100);
  const mood: [MascotMood, string] =
    ratio > 0.5
      ? ["celebrate", t("student.topicDetail.say.almost", "Bạn gần xong chủ đề này rồi!")]
      : doneCount
        ? ["correct", t("student.topicDetail.say.going", "Tiếp tục nhé, đang tiến bộ đấy!")]
        : ["hello", t("student.topicDetail.say.start", "Chọn một bài để bắt đầu nào!")];

  const from = matchedCount > 0 ? page * pageSize + 1 : 0;
  const to = Math.min(matchedCount, page * pageSize + lessons.length);

  return (
    <section className="w-full" id="v-topic">
      <div id="tpHead">
        <Breadcrumbs
          items={[
            {
              label: t("student.lessons.title", "Bài học"),
              to: "/student/lessons",
            },
            { label: name },
          ]}
        />

        <div className="mb-6 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] lg:grid-cols-[72px_minmax(0,1fr)_320px]">
          <div className="grid h-[72px] w-[72px] place-items-center rounded-lg bg-primary-soft text-primary-text">
            <Icon name={null} fallback="library" className="h-9 w-9" />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">
              <span>
                {t("student.topicDetail.topicPrefix", "Chủ đề")}
                {secondaryName ? ` · ${secondaryName}` : ""}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t("student.lessons.topicSec.count", { count: totalCount, defaultValue: `${totalCount} bài` })}</span>
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <LoopiSay mood={mood[0]} text={mood[1]} />
              {playableLessons.length > 0 && (
                <Button variant="secondary" size="sm" leftIcon={<Icon name="shuffle" />} onClick={startRandom}>
                  {t("student.lessons.toolbar.shuffle", "Luyện ngẫu nhiên")}
                </Button>
              )}
            </div>
          </div>

          <div className="col-span-full flex flex-col gap-2.5 rounded-lg border border-border bg-bg-elevated p-4 lg:col-span-1">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-muted">{t("student.topicDetail.completedLabel", "Bạn đã hoàn thành")}</span>
              <b className="tabular-nums">
                {t("student.topicDetail.completedCount", {
                  done: doneCount,
                  total: totalCount,
                  defaultValue: `${doneCount}/${totalCount} bài`,
                })}{" "}
                <span className="text-primary-text">({percentDone}%)</span>
              </b>
            </div>
            <ProgressBar value={ratio * 100} label={t("student.topicDetail.completedLabel", "Bạn đã hoàn thành")} />
          </div>
        </div>
      </div>

      <LibraryToolbar filters={effectiveFilters} onChange={handleFiltersChange} />
      <TopicChips
        topics={topics}
        selected={slug}
        onSelect={(topicId) => {
          if (topicId === "all") navigate("/student/lessons");
          else if (topicId !== slug) navigate(`/student/topics/${topicId}`);
        }}
      />

      {filteredOut && (
        <SectionHeading
          icon="filter"
          title={t("student.lessons.filterResults.title", "Kết quả")}
          count={t("student.lessons.filterResults.count", { count: matchedCount, defaultValue: `${matchedCount} bài` })}
          aside={
            <Button variant="text" size="sm" leftIcon={<Icon name="x" />} onClick={resetFilters}>
              {t("student.lessons.filterResults.resetBtn", "Xoá bộ lọc")}
            </Button>
          }
        />
      )}

      <div className="mt-4">
        {lessonsQuery.isError ? (
          <QueryError error={lessonsQuery.error} onRetry={() => void lessonsQuery.refetch()} retrying={lessonsQuery.isFetching} />
        ) : lessonsQuery.isLoading ? (
          <LessonGridSkeleton count={8} />
        ) : lessons.length > 0 ? (
          <>
            <LessonGrid id="tpGrid" lessons={lessons} />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface/70 px-4 py-3">
              <p className="text-sm tabular-nums text-text-muted" id="tpCount">
                {t("student.lessons.toolbar.showing", {
                  from,
                  to,
                  total: matchedCount,
                  defaultValue: `Hiển thị ${from}–${to} trong ${matchedCount} bài`,
                })}
              </p>
              <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span>{t("student.lessons.toolbar.perPage", "Mỗi trang")}</span>
                <SegmentedControl
                  ariaLabel={t("student.lessons.toolbar.perPage", "Mỗi trang")}
                  value={String(pageSize)}
                  options={LIBRARY_PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
                  onChange={(v) => handlePageSizeChange(Number(v))}
                />
              </div>
            </div>
          </>
        ) : filteredOut ? (
          <EmptyState
            title={t("student.topicDetail.empty.title", "Chưa có bài nào ở mục này")}
            description={t("student.topicDetail.empty.desc", "Đổi trình độ hoặc trạng thái để xem thêm bài.")}
            actionText={t("student.lessons.filterResults.resetBtn", "Xoá bộ lọc")}
            onAction={resetFilters}
          />
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
      </div>
    </section>
  );
};
