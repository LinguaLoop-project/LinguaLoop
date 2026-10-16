import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import { useDebounce } from "@/hooks/useDebounce";
import { useLessonOverview, useLessonSearch, useTopicList } from "../hooks/useLessons";
import { LessonGrid, LessonGridSkeleton } from "../components/LessonGrid";
import QueryError from "../components/QueryError";
import SectionHeading from "../components/SectionHeading";
import ContinueSection from "../components/library/ContinueSection";
import LibraryToolbar from "../components/library/LibraryToolbar";
import TopicChips from "../components/library/TopicChips";
import TopicSection from "../components/library/TopicSection";
import YouTubeImportCard from "../components/library/YouTubeImportCard";
import { DEFAULT_FILTERS, difficultyParam, isFiltered, sortParam } from "../utils";

const RECOMMEND_COUNT = 4;

export const LessonLibraryPage = () => {
  const { t } = useTranslation(["pages", "common"]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const debouncedSearch = useDebounce(filters.search, 300);
  const filtered = isFiltered(filters);

  const { data: topics = [] } = useTopicList();
  const overview = useLessonOverview();
  const search = useLessonSearch({
    q: debouncedSearch,
    difficulty: difficultyParam(filters.level),
    free: filters.freeOnly ? true : undefined,
    sort: sortParam(filters.sort),
    size: 40,
  });

  const results = useMemo(() => search.data?.items ?? [], [search.data]);
  const totalLessons = search.data?.totalElements ?? 0;
  const continueLessons = overview.data?.continueLessons ?? [];
  const topicRows = overview.data?.topicRows ?? [];

  // Gợi ý hợp trình độ B1 (tạm lấy từ kết quả tìm; sẽ đổi sang kết quả kiểm tra trình độ khi có API).
  const b1Lessons = useMemo(() => {
    const b1 = results.filter((l) => l.difficulty === "B1");
    return (b1.length > 0 ? b1 : results).slice(0, RECOMMEND_COUNT);
  }, [results]);

  // Khung (tiêu đề, bộ lọc) luôn hiện; chỉ vùng dữ liệu đổi theo trạng thái (STATES.md §2).
  const active = filtered ? search : overview;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedTopic("all");
  };

  const handleTopicClick = (slug: string) => {
    setSelectedTopic(slug);
    if (filtered) setFilters(DEFAULT_FILTERS);
    // Đợi lưới theo chủ đề hiện ra (khi vừa thoát chế độ lọc) rồi mới cuộn
    setTimeout(() => {
      const el = slug === "all" ? document.getElementById("lsBody") : document.getElementById(`topic-sec-${slug}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const body = () => {
    if (active.isError) {
      return <QueryError error={active.error} onRetry={() => void active.refetch()} retrying={active.isFetching} />;
    }
    if (active.isLoading) return <LessonGridSkeleton />;

    if (filtered) {
      return (
        <div className="mb-8">
          <SectionHeading
            icon="filter"
            title={t("pages:student.lessons.filterResults.title", "Kết quả")}
            count={t("pages:student.lessons.filterResults.count", { count: totalLessons, defaultValue: `${totalLessons} bài` })}
            aside={
              <Button variant="text" size="sm" data-act="lsReset" leftIcon={<Icon name="x" />} onClick={resetFilters}>
                {t("pages:student.lessons.filterResults.resetBtn", "Xoá bộ lọc")}
              </Button>
            }
          />
          {results.length > 0 ? (
            <LessonGrid lessons={results} />
          ) : (
            <EmptyState
              title={t("pages:student.lessons.empty.title", "Không có bài nào khớp")}
              description={t("pages:student.lessons.empty.desc", "Thử bỏ bớt điều kiện hoặc tìm bằng từ khác.")}
              actionText={t("pages:student.lessons.filterResults.resetBtn", "Xoá bộ lọc")}
              onAction={resetFilters}
            />
          )}
        </div>
      );
    }

    if (topicRows.length === 0 && results.length === 0) {
      return (
        <EmptyState
          title={t("pages:student.lessons.library.emptyTitle", "Thư viện đang được cập nhật")}
          description={t("pages:student.lessons.library.emptyDesc", "Chưa có bài học nào. Bạn có thể tự tạo bài từ video YouTube ở phía trên.")}
        />
      );
    }

    return (
      <>
        <ContinueSection lessons={continueLessons} />

        {b1Lessons.length > 0 && (
          <div className="mb-8">
            <SectionHeading
              icon="sparkles"
              title={t("pages:student.lessons.b1Section.title", "Hợp trình độ B1 của bạn")}
              aside={
                <span className="hidden text-sm text-text-muted sm:inline">
                  {t("pages:student.lessons.b1Section.hint", "Gợi ý từ bài kiểm tra trình độ")}
                </span>
              }
            />
            <LessonGrid lessons={b1Lessons} />
          </div>
        )}

        {topicRows.length > 0 ? (
          topicRows.map((row) => <TopicSection key={row.topic.id || row.topic.slug} row={row} />)
        ) : (
          <LessonGrid lessons={results} className="mb-8" />
        )}
      </>
    );
  };

  return (
    <section className="w-full" id="v-lessons">
      <div className="mb-6">
        <div className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary-text" id="lsOver">
          {t("pages:student.lessons.overline", "Thư viện bài học")}
        </div>
        <h1 id="lsTitle" className="font-display text-3xl font-extrabold text-text sm:text-4xl">
          {t("pages:student.lessons.title", "Bài học")}
        </h1>
        <p className="mt-1.5 text-[15px] text-text-muted" id="lsSub">
          {t("pages:student.lessons.subtitle", {
            total: totalLessons,
            topics: topics.length,
            defaultValue: `Nghe chép và shadowing trên video, audio thật · ${totalLessons} bài · ${topics.length} chủ đề`,
          })}
        </p>
      </div>

      <YouTubeImportCard />
      <LibraryToolbar filters={filters} onChange={setFilters} />
      <TopicChips topics={topics} selected={selectedTopic} onSelect={handleTopicClick} />

      <div id="lsBody" aria-busy={active.isLoading}>
        {body()}
      </div>
    </section>
  );
};
