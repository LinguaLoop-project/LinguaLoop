import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import type { MascotMood } from "@/components/common/Mascot";
import { useDebounce } from "@/hooks/useDebounce";
import { useLessonOverview, useLessonSearch, useTopicList } from "../hooks/useLessons";
import { LessonGrid, LessonGridSkeleton } from "../components/LessonGrid";
import type { PracticeMode } from "../components/ModeButton";
import QueryError from "../components/QueryError";
import SectionHeading from "../components/SectionHeading";
import ContinueSection from "../components/library/ContinueSection";
import LibraryToolbar from "../components/library/LibraryToolbar";
import TopicChips from "../components/library/TopicChips";
import TopicSection from "../components/library/TopicSection";
import YouTubeImportButton from "../components/library/YouTubeImportButton";
import type { LessonSummary } from "../types";
import { DEFAULT_FILTERS, difficultyParam, isFiltered, sortParam } from "../utils";

const RECOMMEND_COUNT = 4;

const MOODS: Record<PracticeMode | "all", MascotMood> = { all: "hello", dictation: "listening", shadowing: "speaking" };

const progressOf = (l: LessonSummary, mode: PracticeMode | "all") =>
  mode === "dictation" ? l.progress.dictationPercent : mode === "shadowing" ? l.progress.shadowingPercent : Math.max(l.progress.dictationPercent, l.progress.shadowingPercent);

/** Thư viện bài. `mode` lọc theo chế độ: "Nghe chép" và "Shadowing" trên thanh bên mở cùng thư viện này, thẻ chỉ còn nút của chế độ đó. */
export const LessonLibraryPage = ({ mode = "all" }: { mode?: PracticeMode | "all" }) => {
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
  const topicRows = overview.data?.topicRows ?? [];
  const totalLessons = topics.reduce((sum, topic) => sum + topic.totalLessons, 0) || (search.data?.totalElements ?? 0);

  // Đang học dở: có tiến độ và chưa xong ở chế độ đang xem
  const continueLessons = useMemo(
    () =>
      (overview.data?.continueLessons ?? []).filter((l) => {
        const p = progressOf(l, mode);
        return mode === "all" ? true : p > 0 && p < 100;
      }),
    [overview.data, mode],
  );

  // Gợi ý hợp trình độ B1: bài chưa học, không Pro, nhiều lượt học nhất (tạm lấy từ kết quả tìm; sẽ đổi sang kết quả kiểm tra trình độ khi có API).
  const b1Lessons = useMemo(
    () =>
      results
        .filter((l) => l.difficulty === "B1" && progressOf(l, "all") === 0 && !l.pro)
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, RECOMMEND_COUNT),
    [results],
  );

  // Khung (tiêu đề, bộ lọc) luôn hiện; chỉ vùng dữ liệu đổi theo trạng thái (STATES.md §2).
  const active = filtered ? search : overview;

  // Chip chủ đề sáng theo mục đang cuộn tới (scroll-spy)
  useEffect(() => {
    if (filtered || topicRows.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setSelectedTopic(e.target.id.replace("topic-sec-", ""));
        });
      },
      { rootMargin: "-140px 0px -70% 0px" },
    );
    document.querySelectorAll('[id^="topic-sec-"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filtered, topicRows.length]);

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
        <>
          <SectionHeading
            icon="filter"
            title={t("pages:student.lessons.filterResults.title", "Kết quả")}
            count={t("pages:student.lessons.filterResults.count", { count: results.length, defaultValue: `${results.length} bài` })}
            aside={
              <Button variant="text" size="sm" data-act="lsReset" leftIcon={<Icon name="x" />} onClick={resetFilters}>
                {t("pages:student.lessons.filterResults.resetBtn", "Xoá bộ lọc")}
              </Button>
            }
          />
          {results.length > 0 ? (
            <LessonGrid lessons={results} mode={mode} />
          ) : (
            <EmptyState
              title={t("pages:student.lessons.empty.title", "Không có bài nào khớp")}
              description={t("pages:student.lessons.empty.desc", "Thử bỏ bớt điều kiện hoặc tìm bằng từ khác.")}
              actionText={t("pages:student.lessons.filterResults.resetBtn", "Xoá bộ lọc")}
              onAction={resetFilters}
            />
          )}
        </>
      );
    }

    if (topicRows.length === 0 && results.length === 0) {
      return (
        <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]">
          <img src="/mascot/loopi-hello.svg" alt="" width={120} height={120} className="select-none" draggable={false} />
          <h2 className="mt-2 font-display text-2xl font-bold">{t("pages:student.lessons.library.emptyTitle", "Thư viện đang được cập nhật")}</h2>
          <p className="mt-2 max-w-md text-text-muted">
            {t("pages:student.lessons.library.emptyDesc", "Chưa có bài học nào được đăng. Quay lại sau nhé, hoặc thử tạo bài từ video YouTube của riêng bạn.")}
          </p>
          <div className="mt-6">
            <YouTubeImportButton />
          </div>
        </div>
      );
    }

    return (
      <>
        <ContinueSection lessons={continueLessons} mode={mode} />

        {b1Lessons.length > 0 && (
          <>
            <SectionHeading
              icon="sparkles"
              title={t("pages:student.lessons.b1Section.title", "Hợp trình độ B1 của bạn")}
              aside={<span className="text-[13px] text-text-muted">{t("pages:student.lessons.b1Section.hint", "Gợi ý từ bài kiểm tra trình độ")}</span>}
            />
            <LessonGrid lessons={b1Lessons} mode={mode} />
          </>
        )}

        {topicRows.length > 0 ? (
          topicRows.map((row) => <TopicSection key={row.topic.id || row.topic.slug} row={row} mode={mode} />)
        ) : (
          <LessonGrid lessons={results} className="mt-8" mode={mode} />
        )}
      </>
    );
  };

  const m = `pages:student.lessons.modes.${mode}`;
  return (
    <section className="w-full" id="v-lessons">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text" id="lsOver">
            {t(`${m}.overline`, "Thư viện bài học")}
          </div>
          <h1 id="lsTitle" className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">
            {t(`${m}.title`, "Bài học")}
          </h1>
          <p className="text-text-muted" id="lsSub">
            {t("pages:student.lessons.library.stats", {
              sub: t(`${m}.subtitle`, "Nghe chép và shadowing trên video, audio thật"),
              total: totalLessons.toLocaleString("vi-VN"),
              topics: topics.length,
            })}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <LoopiSay mood={MOODS[mode]} text={t(`${m}.say`, "Hôm nay học gì nào?")} />
          <YouTubeImportButton />
        </div>
      </div>

      <LibraryToolbar filters={filters} onChange={setFilters} />
      <TopicChips topics={topics} selected={selectedTopic} onSelect={handleTopicClick} />

      <div id="lsBody" aria-busy={active.isLoading}>
        {body()}
      </div>
    </section>
  );
};
