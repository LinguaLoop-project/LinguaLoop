import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/common/Button";
import Chip from "@/components/common/Chip";
import Dialog from "@/components/common/Dialog";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import LoopiSay from "@/components/common/LoopiSay";
import type { MascotMood } from "@/components/common/Mascot";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/stores/toastStore";
import QueryError from "../components/QueryError";
import { LessonCardSkeleton } from "../components/LessonCard";
import SavedLessonCard from "../components/saved/SavedLessonCard";
import SavedLessonRow from "../components/saved/SavedLessonRow";
import {
  savedKeys,
  useClearCompletedSaved,
  useSavedLessons,
  useSavedSummary,
  useToggleLessonSaved,
} from "../hooks/useSavedLessons";
import { savedLessonsApi, type SavedLesson, type SavedSort, type SavedSummary } from "../savedLessons";
import { formatTotalMinutes, nextMode } from "../savedUtils";
import type { LessonState } from "../types";
import { cefrLevelParam } from "../utils";

type StateFilter = LessonState | "all";
type LevelFilter = "all" | "basic" | "mid" | "adv";
type ViewMode = "grid" | "list";

const LEVELS: readonly LevelFilter[] = ["all", "basic", "mid", "adv"];
const SORTS: readonly SavedSort[] = ["saved_desc", "saved_asc", "short", "progress_desc"];
const PAGE_SIZES = [6, 12, 24] as const;
const SHORT_MAX_SEC = 180;
const VIEW_STORAGE_KEY = "ll:saved-view";
const SIZE_STORAGE_KEY = "ll:saved-page-size";

function readViewMode(): ViewMode {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function readPageSize(): number {
  try {
    const raw = Number(localStorage.getItem(SIZE_STORAGE_KEY));
    if (PAGE_SIZES.includes(raw as (typeof PAGE_SIZES)[number])) return raw;
  } catch {
    // ignore storage errors
  }
  return 6;
}

function sayFor(summary: SavedSummary | undefined, t: (key: string, opts?: Record<string, unknown>) => string): [MascotMood, string] {
  if (summary && summary.doing > 0) {
    return ["correct", t("say.doing", { count: summary.doing })];
  }
  if (summary && summary.total > 0 && summary.done === summary.total) {
    return ["celebrate", t("say.allDone")];
  }
  return ["hello", t("say.start")];
}

function RowsSkeleton() {
  return (
    <div aria-hidden="true" className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid gap-4 p-4 sm:grid-cols-[224px_1fr]">
          <Skeleton className="aspect-video w-full" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: Math.min(count, 6) }, (_, i) => (
        <LessonCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Bài đã lưu (UC-TC-05): hàng đợi các bài học viên muốn luyện sau. Hỗ trợ thống kê nhanh theo tiến độ,
 * lọc đa dạng (từ khóa, tiến độ, trình độ, chủ đề, miễn phí, bài ngắn), sắp xếp, chuyển đổi lưới/danh sách và phân trang.
 */
export default function SavedLessonsPage() {
  const { t, i18n } = useTranslation("saved");
  const navigate = useNavigate();
  const client = useQueryClient();
  const topRef = useRef<HTMLElement>(null);
  const locale = i18n.language === "vi" ? "vi" : "en";

  const [search, setSearch] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [topic, setTopic] = useState<string>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [shortOnly, setShortOnly] = useState(false);
  const [sort, setSort] = useState<SavedSort>("saved_desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(readPageSize);
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const debouncedSearch = useDebounce(search, 250);
  const summaryQuery = useSavedSummary();
  const summary = summaryQuery.data;

  const query = useSavedLessons({
    q: debouncedSearch.trim(),
    state: state === "all" ? undefined : state,
    cefrLevel: cefrLevelParam(level),
    topic: topic === "all" ? undefined : topic,
    free: freeOnly || undefined,
    maxDuration: shortOnly ? SHORT_MAX_SEC : undefined,
    sort,
    page,
    size: pageSize,
  });

  const toggle = useToggleLessonSaved();
  const clearCompleted = useClearCompletedSaved();
  const now = useMemo(() => new Date(), []);
  const data = query.data;
  const filtered =
    search.trim() !== "" ||
    state !== "all" ||
    level !== "all" ||
    topic !== "all" ||
    freeOnly ||
    shortOnly;

  const hasAnySaved = (summary?.total ?? data?.totalElements ?? 0) > 0;
  const availableItems = useMemo(
    () => (data?.items ?? []).filter((item) => item.availability === "available"),
    [data?.items],
  );
  const [mood, say] = sayFor(summary, (key, opts) => t(key, opts));

  const changeView = (next: ViewMode) => {
    setViewMode(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  const changePageSize = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(0);
    try {
      localStorage.setItem(SIZE_STORAGE_KEY, String(nextSize));
    } catch {
      // ignore storage errors
    }
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reset = () => {
    setSearch("");
    setState("all");
    setLevel("all");
    setTopic("all");
    setFreeOnly(false);
    setShortOnly(false);
    setSort("saved_desc");
    setPage(0);
  };

  const startRandom = () => {
    if (availableItems.length === 0) return;
    const picked = availableItems[Math.floor(Math.random() * availableItems.length)];
    navigate(`/student/${nextMode(picked.progress)}/${picked.id}`);
  };

  const unsave = (lesson: SavedLesson) => {
    setBusyId(lesson.id);
    toggle.mutate(
      { lessonId: lesson.id, saved: false },
      {
        onSuccess: () =>
          toast(t("toast.unsaved"), {
            icon: "bookmark",
            action: {
              label: t("toast.undo"),
              onClick: () => {
                savedLessonsApi
                  .setSaved(lesson.id, true)
                  .then(() => {
                    void client.invalidateQueries({ queryKey: savedKeys.all });
                    toast(t("toast.restored"), { icon: "bookmark-check" });
                  })
                  .catch(() => toast(t("toast.failed"), { icon: "circle-alert" }));
              },
            },
          }),
        onError: () => toast(t("toast.failed"), { icon: "circle-alert" }),
        onSettled: () => setBusyId(null),
      },
    );
  };

  const handleClearCompleted = () => {
    clearCompleted.mutate(undefined, {
      onSuccess: (res) => {
        setConfirmClear(false);
        if (state === "done") setState("all");
        setPage(0);
        toast(t("toast.clearedDone", { count: res.removedCount }), { icon: "circle-check" });
      },
      onError: () => toast(t("toast.failed"), { icon: "circle-alert" }),
    });
  };

  const statCards: { value: StateFilter; count: number; icon: string; tone: string }[] = [
    { value: "all", count: summary?.total ?? 0, icon: "bookmark-check", tone: "text-primary-text" },
    { value: "todo", count: summary?.todo ?? 0, icon: "hourglass", tone: "text-danger" },
    { value: "doing", count: summary?.doing ?? 0, icon: "flame", tone: "text-warning" },
    { value: "done", count: summary?.done ?? 0, icon: "circle-check", tone: "text-success" },
  ];

  const body = () => {
    if (query.isError && !data) {
      return <QueryError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
    }
    if (!data) return viewMode === "grid" ? <GridSkeleton count={pageSize} /> : <RowsSkeleton />;
    if (data.totalElements === 0) {
      return filtered ? (
        <EmptyState
          icon="search"
          mascotSrc=""
          title={t("noMatch.title")}
          description={t("noMatch.desc")}
          actionText={t("noMatch.clear")}
          onAction={reset}
        />
      ) : (
        <EmptyState title={t("empty.title")} description={t("empty.desc")}>
          <div className="flex flex-wrap justify-center gap-3">
            <Button leftIcon={<Icon name="library" />} onClick={() => navigate("/student/lessons")}>
              {t("empty.library")}
            </Button>
            <Button variant="ghost" leftIcon={<Icon name="monitor-play" />} onClick={() => navigate("/watch")}>
              {t("empty.watch")}
            </Button>
          </div>
        </EmptyState>
      );
    }

    const from = data.page * data.size + 1;
    const to = Math.min(data.totalElements, (data.page + 1) * data.size);

    return (
      <>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((lesson) => (
              <SavedLessonCard key={lesson.id} lesson={lesson} now={now} busy={busyId === lesson.id} onUnsave={unsave} />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
            {data.items.map((lesson) => (
              <SavedLessonRow key={lesson.id} lesson={lesson} now={now} busy={busyId === lesson.id} onUnsave={unsave} />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface/70 px-4 py-3">
          <p className="text-sm tabular-nums text-text-muted">
            {t("pagination.showing", { from, to, total: data.totalElements })}
          </p>

          <Pagination page={data.page} totalPages={data.totalPages} onChange={handlePageChange} />

          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>{t("pagination.perPage")}</span>
            <SegmentedControl
              ariaLabel={t("pagination.perPage")}
              value={String(pageSize)}
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              onChange={(v) => changePageSize(Number(v))}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <section ref={topRef} className="w-full" aria-busy={query.isFetching}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:flex-nowrap">
        <div className="min-w-0 lg:flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-text">
              <Icon name="bookmark-check" className="size-3.5" />
              {t("overline")}
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("title")}</h1>
          <p className="mt-1 text-text-muted">
            {summary && summary.total > 0 && summary.totalDurationSec > 0
              ? t("summaryMeta", {
                  count: summary.total,
                  duration: formatTotalMinutes(summary.totalDurationSec, locale),
                })
              : t("subtitle")}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3">
          {hasAnySaved && <LoopiSay mood={mood} text={say} />}
          {availableItems.length > 0 && (
            <Button variant="primary" size="sm" leftIcon={<Icon name="shuffle" />} onClick={startRandom}>
              {t("actions.shuffle")}
            </Button>
          )}
          {summary && summary.done > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Icon name="trash-2" />}
              onClick={() => setConfirmClear(true)}
            >
              {t("actions.clearDone", { count: summary.done })}
            </Button>
          )}
        </div>
      </header>

      {hasAnySaved && (
        <>
          <div
            role="group"
            aria-label={t("stateLabel")}
            className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {statCards.map((card) => {
              const active = state === card.value;
              return (
                <button
                  key={card.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setState(card.value);
                    setPage(0);
                  }}
                  className={`flex cursor-pointer items-start justify-between rounded-lg border p-4 text-left shadow-[var(--shadow-card)] transition-all duration-150 ${
                    active
                      ? "border-primary bg-primary-soft/60 shadow-[0_0_0_1px_var(--primary)]"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover/60"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${card.tone}`}>
                      {t(`states.${card.value}`)}
                    </span>
                    <span className="font-display text-[30px] font-bold tabular-nums leading-none">
                      {card.count}
                    </span>
                    <span className="text-[13px] text-text-muted">
                      {t(`stateHints.${card.value}`)}
                    </span>
                  </div>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-md bg-bg-elevated ${card.tone}`}>
                    <Icon name={card.icon} className="size-5" />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-4 flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
            <SearchInput
              placeholder={t("search")}
              ariaLabel={t("search")}
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
              className="w-full min-w-[220px] sm:flex-1"
            />

            <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
              <SegmentedControl
                ariaLabel={t("levelLabel")}
                value={level}
                options={LEVELS.map((value) => ({ value, label: t(`levels.${value}`) }))}
                onChange={(value) => {
                  setLevel(value as LevelFilter);
                  setPage(0);
                }}
              />
            </div>

            <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
              <SegmentedControl
                ariaLabel={t("sortLabel")}
                value={sort}
                options={SORTS.map((value) => ({ value, label: t(`sorts.${value}`) }))}
                onChange={(value) => {
                  setSort(value as SavedSort);
                  setPage(0);
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip
                active={freeOnly}
                onClick={() => {
                  setFreeOnly((prev) => !prev);
                  setPage(0);
                }}
              >
                <Icon name="lock-open" className="text-lg" />
                {t("filters.freeOnly")}
              </Chip>

              <Chip
                active={shortOnly}
                onClick={() => {
                  setShortOnly((prev) => !prev);
                  setPage(0);
                }}
              >
                <Icon name="clock" className="text-lg" />
                {t("filters.shortOnly")}
              </Chip>

              <div
                role="group"
                aria-label={t("view.label")}
                className="ml-auto inline-flex items-center rounded-md border border-border bg-surface p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={viewMode === "grid"}
                  aria-label={t("view.grid")}
                  title={t("view.grid")}
                  onClick={() => changeView("grid")}
                  className={`grid size-8 cursor-pointer place-items-center rounded-sm transition-colors ${
                    viewMode === "grid"
                      ? "bg-[var(--btn-primary)] text-white"
                      : "text-text-muted hover:bg-surface-hover hover:text-text"
                  }`}
                >
                  <Icon name="layout-grid" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === "list"}
                  aria-label={t("view.list")}
                  title={t("view.list")}
                  onClick={() => changeView("list")}
                  className={`grid size-8 cursor-pointer place-items-center rounded-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-[var(--btn-primary)] text-white"
                      : "text-text-muted hover:bg-surface-hover hover:text-text"
                  }`}
                >
                  <Icon name="list" className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {summary && summary.topics.length > 1 && (
            <div
              role="group"
              aria-label={t("filters.topicsLabel")}
              className="mb-5 flex gap-2 overflow-x-auto pb-1.5 [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]"
            >
              <Chip
                active={topic === "all"}
                onClick={() => {
                  setTopic("all");
                  setPage(0);
                }}
                count={summary.total}
              >
                <Icon name="layout-grid" className="text-lg" />
                {t("filters.allTopics")}
              </Chip>
              {summary.topics.map((item) => (
                <Chip
                  key={item.name}
                  active={topic === item.name}
                  onClick={() => {
                    setTopic(item.name);
                    setPage(0);
                  }}
                  count={item.count}
                  title={item.name}
                >
                  <Icon name="hash" className="text-lg" />
                  <span className="max-w-[180px] truncate">{item.name}</span>
                </Chip>
              ))}
            </div>
          )}

          {filtered && data && (
            <div className="mb-4 flex items-center justify-between gap-3 text-sm">
              <span className="text-text-muted">{t("filters.resultsCount", { count: data.totalElements })}</span>
              <Button variant="text" size="sm" leftIcon={<Icon name="x" />} onClick={reset}>
                {t("filters.clear")}
              </Button>
            </div>
          )}
        </>
      )}

      {body()}

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} labelledBy="clear-done-title">
        <h2 id="clear-done-title" className="font-display text-xl font-bold">
          {t("actions.clearDoneTitle")}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {t("actions.clearDoneDesc", { count: summary?.done ?? 0 })}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={clearCompleted.isPending}
            onClick={handleClearCompleted}
          >
            {t("actions.clearDoneConfirm", { count: summary?.done ?? 0 })}
          </Button>
        </div>
      </Dialog>

      <p className="sr-only" role="status">
        {query.isFetching ? "" : data ? t("count", { count: data.totalElements }) : ""}
      </p>
    </section>
  );
}
