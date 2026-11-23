import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import type { MascotMood } from "@/components/common/Mascot";
import Pagination from "@/components/common/Pagination";
import SegmentedControl from "@/components/common/SegmentedControl";
import { useLessonOverview, useLessonSearch, useTopicList } from "../hooks/useLessons";
import { useLibraryFilters, usePageClamp } from "../hooks/useLibraryFilters";
import { LIBRARY_PAGE_SIZES, SHORT_MAX_SEC } from "../libraryFilters";
import { LessonGrid, LessonGridSkeleton } from "../components/LessonGrid";
import type { PracticeMode } from "../components/ModeButton";
import QueryError from "../components/QueryError";
import SectionHeading from "../components/SectionHeading";
import ContinueSection from "../components/library/ContinueSection";
import LibraryToolbar from "../components/library/LibraryToolbar";
import TopicChips from "../components/library/TopicChips";
import TopicSection from "../components/library/TopicSection";
import YouTubeImportButton from "../components/library/YouTubeImportButton";
import { nextMode } from "../savedUtils";
import type { LessonState, LessonSummary } from "../types";
import { cefrLevelParam, isFiltered, sortParam } from "../utils";

const RECOMMEND_COUNT = 8;

const MOODS: Record<PracticeMode | "all", MascotMood> = { all: "hello", dictation: "listening", shadowing: "speaking" };

const MODE_ACCENT: Record<PracticeMode | "all", { overline: string; icon: string; badge: string }> = {
  all: { overline: "text-primary-text", icon: "library", badge: "border-primary/30 bg-primary-soft text-primary-text" },
  dictation: {
    overline: "text-fn-dictation",
    icon: "headphones",
    badge: "border-fn-dictation/40 bg-[color-mix(in_srgb,var(--fn-dictation)_14%,transparent)] text-fn-dictation",
  },
  shadowing: {
    overline: "text-fn-shadowing",
    icon: "mic",
    badge: "border-fn-shadowing/40 bg-[color-mix(in_srgb,var(--fn-shadowing)_14%,transparent)] text-fn-shadowing",
  },
};

const progressOf = (l: LessonSummary, mode: PracticeMode | "all") =>
  mode === "dictation" ? l.progress.dictationPercent : mode === "shadowing" ? l.progress.shadowingPercent : Math.max(l.progress.dictationPercent, l.progress.shadowingPercent);

/** Thư viện bài. `mode` lọc theo chế độ: "Nghe chép" và "Shadowing" trên thanh bên mở cùng thư viện này, thẻ chỉ còn nút của chế độ đó. */
export const LessonLibraryPage = ({ mode = "all" }: { mode?: PracticeMode | "all" }) => {
  const { t } = useTranslation(["pages", "common"]);
  const navigate = useNavigate();
  const topRef = useRef<HTMLElement>(null);
  const { filters, effectiveFilters, page, pageSize, updateParams, setPage, handleFiltersChange, resetFilters, handlePageSizeChange } =
    useLibraryFilters({ withTopic: true });
  const filtered = isFiltered(filters);

  const { data: topics = [] } = useTopicList();
  const overview = useLessonOverview();
  const search = useLessonSearch({
    q: filters.search.trim() || undefined,
    topicId: filters.topic === "all" ? undefined : filters.topic,
    cefrLevel: cefrLevelParam(filters.level),
    free: filters.freeOnly ? true : undefined,
    maxDuration: filters.shortOnly ? SHORT_MAX_SEC : undefined,
    state: filters.state === "all" ? undefined : (filters.state as LessonState),
    sort: sortParam(filters.sort),
    page: filtered ? page : 0,
    size: filtered ? pageSize : 60,
  });

  const results = useMemo(() => search.data?.items ?? [], [search.data]);
  const totalFiltered = search.data?.totalElements ?? 0;
  const totalPages = search.data?.totalPages ?? 0;
  const topicRows = useMemo(() => overview.data?.topicRows ?? [], [overview.data]);
  const totalLessons = topics.reduce((sum, topic) => sum + topic.totalLessons, 0) || totalFiltered;

  // Đang học dở: có tiến độ và chưa xong ở chế độ đang xem
  const continueLessons = useMemo(
    () =>
      (overview.data?.continueLessons ?? []).filter((l) => {
        const p = progressOf(l, mode);
        return mode === "all" ? true : p > 0 && p < 100;
      }),
    [overview.data, mode],
  );

  // Gợi ý hợp trình độ B1: bài chưa học, không Pro, nhiều lượt học nhất (gộp từ cả kết quả tìm kiếm và các hàng chủ đề để luôn đủ 6 bài)
  const b1Lessons = useMemo(() => {
    const seen = new Set<string>();
    const combined = [...results, ...topicRows.flatMap((r) => r.lessons)];
    return combined
      .filter((l) => {
        if (seen.has(l.id)) return false;
        seen.add(l.id);
        return l.cefrLevel === "B1" && progressOf(l, "all") === 0 && !l.pro;
      })
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, RECOMMEND_COUNT);
  }, [results, topicRows]);

  // Danh sách bài khả dụng (không bị khóa Pro) để phục vụ nút "Luyện ngẫu nhiên"
  const playablePool = useMemo(() => {
    const source = filtered ? results : [...continueLessons, ...topicRows.flatMap((r) => r.lessons), ...results];
    const seen = new Set<string>();
    return source.filter((l) => {
      if (l.locked || seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });
  }, [filtered, results, continueLessons, topicRows]);

  const active = filtered ? search : overview;

  // Khi lọc đổi làm page vượt quá totalPages, tự lùi về trang cuối
  usePageClamp(page, totalPages, filtered, setPage);

  const handleTopicClick = (topicId: string) => {
    updateParams({ ...filters, topic: topicId }, 0);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startRandom = () => {
    if (playablePool.length === 0) return;
    const picked = playablePool[Math.floor(Math.random() * playablePool.length)];
    const targetMode: PracticeMode = mode === "all" ? nextMode(picked.progress) : mode;
    navigate(`/student/${targetMode}/${picked.id}`);
  };

  const body = () => {
    if (active.isError) {
      return <QueryError error={active.error} onRetry={() => void active.refetch()} retrying={active.isFetching} />;
    }
    if (active.isLoading) return <LessonGridSkeleton />;

    if (filtered) {
      const from = totalFiltered > 0 ? page * pageSize + 1 : 0;
      const to = Math.min(totalFiltered, (page + 1) * pageSize);
      return (
        <>
          <SectionHeading
            icon="filter"
            title={t("pages:student.lessons.filterResults.title", "Kết quả")}
            count={t("pages:student.lessons.filterResults.count", { count: totalFiltered, defaultValue: `${totalFiltered} bài` })}
            aside={
              <Button variant="text" size="sm" data-act="lsReset" leftIcon={<Icon name="x" />} onClick={resetFilters}>
                {t("pages:student.lessons.filterResults.resetBtn", "Xoá bộ lọc")}
              </Button>
            }
          />
          {results.length > 0 ? (
            <>
              <LessonGrid lessons={results} mode={mode} />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface/70 px-4 py-3">
                <p className="text-sm tabular-nums text-text-muted">
                  {t("pages:student.lessons.toolbar.showing", {
                    from,
                    to,
                    total: totalFiltered,
                    defaultValue: `Hiển thị ${from}–${to} trong ${totalFiltered} bài`,
                  })}
                </p>
                <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span>{t("pages:student.lessons.toolbar.perPage", "Mỗi trang")}</span>
                  <SegmentedControl
                    ariaLabel={t("pages:student.lessons.toolbar.perPage", "Mỗi trang")}
                    value={String(pageSize)}
                    options={LIBRARY_PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
                    onChange={(v) => handlePageSizeChange(Number(v))}
                  />
                </div>
              </div>
            </>
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
          topicRows.map((row) => <TopicSection key={row.topic.id} row={row} mode={mode} />)
        ) : (
          <LessonGrid lessons={results} className="mt-8" mode={mode} />
        )}
      </>
    );
  };

  const m = `pages:student.lessons.modes.${mode}`;
  const accent = MODE_ACCENT[mode];

  return (
    <section ref={topRef} className="w-full" id="v-lessons">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:flex-nowrap">
        <div className="min-w-0 lg:flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${accent.badge}`} id="lsOver">
              <Icon name={accent.icon} className="size-3.5" />
              {t(`${m}.overline`, "Thư viện bài học")}
            </span>
          </div>
          <h1 id="lsTitle" className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">
            {t(`${m}.title`, "Bài học")}
          </h1>
          <p className="mt-1 text-text-muted" id="lsSub">
            {t("pages:student.lessons.library.stats", {
              sub: t(`${m}.subtitle`, "Nghe chép và shadowing trên video, audio thật"),
              total: totalLessons.toLocaleString("vi-VN"),
              topics: topics.length,
            })}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3">
          <LoopiSay mood={MOODS[mode]} text={t(`${m}.say`, "Hôm nay học gì nào?")} />
          {playablePool.length > 0 && (
            <Button
              variant={mode === "all" ? "secondary" : "fn"}
              fn={mode === "all" ? undefined : mode}
              size="sm"
              leftIcon={<Icon name="shuffle" />}
              onClick={startRandom}
            >
              {t("pages:student.lessons.toolbar.shuffle", "Luyện ngẫu nhiên")}
            </Button>
          )}
          <YouTubeImportButton />
        </div>
      </div>

      <LibraryToolbar filters={effectiveFilters} onChange={handleFiltersChange} />
      <TopicChips topics={topics} selected={filters.topic} onSelect={handleTopicClick} />

      <div id="lsBody" aria-busy={active.isLoading}>
        {body()}
      </div>
    </section>
  );
};
