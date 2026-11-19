import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { toast } from "@/stores/toastStore";
import Pagination from "../components/Pagination";
import QueryError from "../components/QueryError";
import SavedLessonRow from "../components/saved/SavedLessonRow";
import { savedLessonsApi, type SavedLesson, type SavedSort } from "../savedLessons";
import { savedKeys, useSavedLessons, useToggleLessonSaved } from "../hooks/useSavedLessons";
import { useQueryClient } from "@tanstack/react-query";
import type { LessonState } from "../types";

type StateFilter = LessonState | "all";

const STATES: readonly StateFilter[] = ["all", "todo", "doing", "done"];
const SORTS: readonly SavedSort[] = ["saved_desc", "saved_asc"];

function RowsSkeleton() {
  return (
    <div aria-hidden="true" className="divide-y divide-border">
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

/**
 * Bài đã lưu (UC-TC-05): hàng đợi các bài học viên muốn luyện sau, xếp thành danh sách một cột để đọc được tiêu đề,
 * tiến độ và hành động tiếp theo của từng bài. Tìm theo tên, lọc theo tiến độ, đổi thứ tự lưu.
 */
export default function SavedLessonsPage() {
  const { t } = useTranslation("saved");
  const navigate = useNavigate();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  const [sort, setSort] = useState<SavedSort>("saved_desc");
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const query = useSavedLessons({ q: search.trim(), state: state === "all" ? undefined : state, sort, page });
  const toggle = useToggleLessonSaved();
  const now = useMemo(() => new Date(), []);
  const data = query.data;
  const filtered = search.trim() !== "" || state !== "all";

  const reset = () => {
    setSearch("");
    setState("all");
    setPage(0);
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

  const body = () => {
    if (query.isError && !data) {
      return <QueryError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
    }
    if (!data) return <RowsSkeleton />;
    if (data.totalElements === 0) {
      return filtered ? (
        <EmptyState icon="search" mascotSrc="" title={t("noMatch.title")} description={t("noMatch.desc")} actionText={t("noMatch.clear")} onAction={reset} />
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
    return (
      <>
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
          {data.items.map((lesson) => (
            <SavedLessonRow key={lesson.id} lesson={lesson} now={now} busy={busyId === lesson.id} onUnsave={unsave} />
          ))}
        </div>
        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
      </>
    );
  };

  return (
    <section className="mx-auto w-full max-w-[1000px]" aria-busy={query.isFetching}>
      <header className="mb-6">
        <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">
          {t("title")}
          {data && data.totalElements > 0 && !filtered && (
            <small className="ml-3 align-middle text-base font-normal tracking-normal text-text-muted">
              {t("count", { count: data.totalElements })}
            </small>
          )}
        </h1>
        <p className="mt-1 max-w-xl text-text-muted">{t("subtitle")}</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder={t("search")}
          ariaLabel={t("search")}
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          className="min-w-[220px] flex-1 sm:max-w-xs"
        />
        <SegmentedControl
          ariaLabel={t("stateLabel")}
          value={state}
          options={STATES.map((value) => ({ value, label: t(`states.${value}`) }))}
          onChange={(value) => {
            setState(value as StateFilter);
            setPage(0);
          }}
        />
        <SegmentedControl
          className="ml-auto"
          ariaLabel={t("sortLabel")}
          value={sort}
          options={SORTS.map((value) => ({ value, label: t(`sorts.${value}`) }))}
          onChange={(value) => {
            setSort(value as SavedSort);
            setPage(0);
          }}
        />
      </div>

      {body()}
      <p className="sr-only" role="status">
        {query.isFetching ? "" : data ? t("count", { count: data.totalElements }) : ""}
      </p>
    </section>
  );
}
