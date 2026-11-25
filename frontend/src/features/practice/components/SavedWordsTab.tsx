import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { Checkbox } from "@/components/common/Checkbox";
import Chip from "@/components/common/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import { playPronunciation } from "@/features/dictionary";
import {
  EMPTY_FILTER,
  filterSavedWords,
  StatCard,
  savedWordStats,
  useSavedWords,
  useUnsaveWord,
  type CardStatus,
  type SavedWord,
  type SavedWordFilter,
  type SourceFilter,
  type StateFilter,
} from "@/features/vocab";
import { toast } from "@/stores/toastStore";
import { dateFormatter, isNetworkError } from "../utils";
import ListState from "./ListState";

type WordSort = "newest" | "due_first" | "alpha";

const SOURCES: SourceFilter[] = ["all", "dictionary", "lesson"];
const SORTS: WordSort[] = ["newest", "due_first", "alpha"];
const PAGE_SIZES = [10, 20, 50] as const;

const STATUS_TONE: Record<CardStatus, "warning" | "info" | "success" | undefined> = {
  new: undefined,
  learning: "warning",
  reviewing: "info",
  mastered: "success",
};

interface WordRowProps {
  item: SavedWord;
  selected: boolean;
  hideMeaning: boolean;
  onToggle: () => void;
  onUnsave: () => void;
  busy: boolean;
}

function WordRow({ item, selected, hideMeaning, onToggle, onUnsave, busy }: WordRowProps) {
  const { t, i18n } = useTranslation("mywords");
  const [revealed, setRevealed] = useState(false);
  const next = item.due
    ? t("words.next.due")
    : item.nextReviewAt
      ? dateFormatter(i18n.language).format(new Date(item.nextReviewAt))
      : t("words.next.none");
  const tone = STATUS_TONE[item.status];
  const blurred = hideMeaning && !revealed;

  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border px-5 py-4 transition-colors last:border-b-0 ${selected ? "bg-primary-soft" : "hover:bg-surface-hover/40"}`}>
      <Checkbox
        containerClassName="flex-none"
        aria-label={t("words.select", { word: item.headword })}
        checked={selected}
        onChange={onToggle}
      />
      <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/student/dictionary/${encodeURIComponent(item.headword)}`}
            className="font-display text-lg font-bold transition-colors hover:text-primary-text"
          >
            {item.headword}
          </Link>
          {item.ipaUs && <span className="text-sm text-text-muted">{item.ipaUs}</span>}
          {item.pos && (
            <span className="rounded-full border border-border bg-bg-elevated px-2 py-0.5 text-[11px] font-semibold text-text-muted">
              {item.pos}
            </span>
          )}
        </div>
        {item.meaningVi && (
          <span
            onClick={() => {
              if (hideMeaning) setRevealed((r) => !r);
            }}
            title={blurred ? t("words.quiz.revealHint") : undefined}
            className={`transition-all duration-150 ${
              blurred ? "cursor-pointer select-none blur-[5px] hover:blur-none" : ""
            }`}
          >
            {item.meaningVi}
          </span>
        )}
        {item.source === "lesson" && item.contextEn && (
          <q className="text-[13px] italic text-text-muted">{item.contextEn}</q>
        )}
        <span className="inline-flex flex-wrap items-center gap-1.5 text-[13px] text-text-muted">
          {item.lesson ? (
            <Link to={`/student/lessons/${item.lesson.lessonId}`} className="inline-flex items-center gap-1 transition-colors hover:text-primary-text">
              <Icon name="play" className="h-3.5 w-3.5" />
              {t("words.fromLesson", { title: item.lesson.title })}
            </Link>
          ) : item.source === "lesson" ? (
            <>
              <Icon name="play" className="h-3.5 w-3.5" />
              {t("words.lessonGone")}
            </>
          ) : (
            <>
              <Icon name="book-open-text" className="h-3.5 w-3.5" />
              {t("words.fromDictionary")}
            </>
          )}
        </span>
      </div>
      <div className="flex w-[160px] flex-none flex-col items-start gap-1">
        <Badge tone={tone}>{t(`words.status.${item.status}`)}</Badge>
        <span className={`whitespace-nowrap text-[13px] ${item.due ? "font-semibold text-danger" : "text-text-muted"}`}>
          {t("words.nextLabel")}: {next}
        </span>
      </div>
      <div className="flex flex-none items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={t("words.listen", { word: item.headword })}
          title={t("words.listen", { word: item.headword })}
          onClick={() => playPronunciation(item.headword, "us", item.audioUs)}
        >
          <Icon name="volume-2" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          isLoading={busy}
          aria-label={t("words.unsaveAria", { word: item.headword })}
          title={t("words.unsaveAria", { word: item.headword })}
          onClick={onUnsave}
        >
          <Icon name="trash-2" />
        </Button>
      </div>
    </li>
  );
}

/** Tab "Từ đã lưu": các nghĩa đã lưu từ từ điển hoặc bài học, kèm trạng thái ôn; tìm, lọc, tự nhẩm nghĩa và phân trang (UC-HT-07). */
export default function SavedWordsTab() {
  const { t } = useTranslation("mywords");
  const query = useSavedWords();
  const unsave = useUnsaveWord();
  const [filter, setFilter] = useState<SavedWordFilter>(EMPTY_FILTER);
  const [posFilter, setPosFilter] = useState<string>("all");
  const [sort, setSort] = useState<WordSort>("newest");
  const [hideMeaning, setHideMeaning] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const all = useMemo(() => query.data ?? [], [query.data]);
  const stats = useMemo(() => savedWordStats(all), [all]);

  const posCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of all) {
      if (item.pos) map.set(item.pos, (map.get(item.pos) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const items = useMemo(() => {
    const base = filterSavedWords(all, filter).filter((item) => posFilter === "all" || item.pos === posFilter);
    const copy = [...base];
    if (sort === "alpha") {
      copy.sort((a, b) => a.headword.localeCompare(b.headword));
    } else if (sort === "due_first") {
      copy.sort((a, b) => Number(b.due) - Number(a.due));
    }
    return copy;
  }, [all, filter, posFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = useMemo(
    () => items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [items, safePage, pageSize],
  );

  const selectedIds = items.filter((item) => selected.has(item.id)).map((item) => item.id);
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const hasActiveFilter =
    filter.query.trim() !== "" || filter.source !== "all" || filter.state !== "all" || posFilter !== "all";

  const resetFilters = () => {
    setFilter(EMPTY_FILTER);
    setPosFilter("all");
    setPage(0);
  };

  const failure = (error: unknown) =>
    toast(isNetworkError(error) ? t("offline") : t("words.unsaveFailed"), { icon: "circle-alert" });

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const onUnsaveOne = (item: SavedWord) => {
    setBusyId(item.id);
    unsave.mutate(item.id, {
      onSuccess: () => toast(t("words.unsaved", { count: 1 }), { icon: "bookmark" }),
      onError: failure,
      onSettled: () => setBusyId(null),
    });
  };

  const onUnsaveSelected = async () => {
    setBulkBusy(true);
    const results = await Promise.allSettled(selectedIds.map((id) => unsave.mutateAsync(id)));
    setBulkBusy(false);
    const removed = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (removed > 0) toast(t("words.unsaved", { count: removed }), { icon: "bookmark" });
    if (failed) failure(failed.reason);
    setSelected(new Set());
  };

  const setState = (state: StateFilter) => {
    setFilter((current) => ({ ...current, state }));
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-4">
      <ListState query={query} skeletonRows={4}>
        {all.length === 0 ? (
          <EmptyState title={t("words.emptyTitle")} description={t("words.emptyDesc")} />
        ) : (
          <>
            <div role="group" aria-label={t("words.stats.label")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label={t("words.stats.total")}
                value={stats.total}
                hint={t("words.stats.totalHint")}
                tone="text-primary-text"
                icon="bookmark-check"
                active={filter.state === "all"}
                onClick={() => setState("all")}
              />
              <StatCard
                label={t("words.stats.due")}
                value={stats.due}
                hint={t("words.stats.dueHint")}
                tone="text-danger"
                icon="flame"
                active={filter.state === "due"}
                onClick={() => setState("due")}
              />
              <StatCard
                label={t("words.stats.learning")}
                value={stats.learning}
                hint={t("words.stats.learningHint")}
                tone="text-warning"
                icon="hourglass"
                active={filter.state === "learning"}
                onClick={() => setState("learning")}
              />
              <StatCard
                label={t("words.stats.mastered")}
                value={stats.mastered}
                hint={t("words.stats.masteredHint")}
                tone="text-success"
                icon="circle-check"
                active={filter.state === "mastered"}
                onClick={() => setState("mastered")}
              />
            </div>

            <div className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
              <SearchInput
                className="w-full min-w-[220px] sm:flex-1"
                value={filter.query}
                onChange={(q) => {
                  setFilter((current) => ({ ...current, query: q }));
                  setPage(0);
                }}
                placeholder={t("words.search.placeholder")}
                ariaLabel={t("words.search.aria")}
              />
              <SegmentedControl
                ariaLabel={t("words.source.label")}
                value={filter.source}
                onChange={(value) => {
                  setFilter((current) => ({ ...current, source: value as SourceFilter }));
                  setPage(0);
                }}
                options={SOURCES.map((value) => ({ value, label: t(`words.source.${value}`) }))}
              />
              <SegmentedControl
                ariaLabel={t("words.sorts.label")}
                value={sort}
                onChange={(value) => {
                  setSort(value as WordSort);
                  setPage(0);
                }}
                options={SORTS.map((value) => ({ value, label: t(`words.sorts.${value}`) }))}
              />
              <Chip active={hideMeaning} onClick={() => setHideMeaning((v) => !v)}>
                <Icon name={hideMeaning ? "eye" : "eye-off"} className="text-lg" />
                {hideMeaning ? t("words.quiz.showMeaning") : t("words.quiz.hideMeaning")}
              </Chip>
            </div>

            {posCounts.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={posFilter === "all"}
                  count={all.length}
                  onClick={() => {
                    setPosFilter("all");
                    setPage(0);
                  }}
                >
                  {t("words.pos.all")}
                </Chip>
                {posCounts.map(([pos, count]) => (
                  <Chip
                    key={pos}
                    active={posFilter === pos}
                    count={count}
                    onClick={() => {
                      setPosFilter(pos);
                      setPage(0);
                    }}
                  >
                    {pos}
                  </Chip>
                ))}
              </div>
            )}

            {items.length === 0 ? (
              <EmptyState
                title={t("words.emptyFilteredTitle")}
                description={t("words.emptyFilteredDesc")}
                actionText={t("words.clearFilters")}
                onAction={resetFilters}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
                  <Checkbox
                    containerClassName="flex-none"
                    label={t("words.selectAll")}
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)))}
                  />
                  {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span aria-live="polite">{t("words.selected", { count: selectedIds.length })}</span>
                      <Button variant="ghost" size="sm" isLoading={bulkBusy} leftIcon={<Icon name="trash-2" />} onClick={() => void onUnsaveSelected()}>
                        {t("words.unsave")}
                      </Button>
                      <Button variant="text" size="sm" disabled={bulkBusy} onClick={() => setSelected(new Set())}>
                        {t("words.clearSelection")}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>{t("words.count", { count: items.length })}</span>
                      {hasActiveFilter && (
                        <Button variant="text" size="sm" leftIcon={<Icon name="x" />} onClick={resetFilters}>
                          {t("words.clearFilters")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <ul className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
                  {pagedItems.map((item) => (
                    <WordRow
                      key={item.id}
                      item={item}
                      selected={selected.has(item.id)}
                      hideMeaning={hideMeaning}
                      onToggle={() => toggle(item.id)}
                      onUnsave={() => onUnsaveOne(item)}
                      busy={busyId === item.id}
                    />
                  ))}
                </ul>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface/70 px-4 py-3">
                  <p className="text-sm tabular-nums text-text-muted">
                    {t("pagination.showing", {
                      from: safePage * pageSize + 1,
                      to: Math.min(items.length, (safePage + 1) * pageSize),
                      total: items.length,
                    })}
                  </p>
                  <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span>{t("pagination.perPage")}</span>
                    <SegmentedControl
                      ariaLabel={t("pagination.perPage")}
                      value={String(pageSize)}
                      options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
                      onChange={(v) => {
                        setPageSize(Number(v));
                        setPage(0);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </ListState>
    </div>
  );
}
