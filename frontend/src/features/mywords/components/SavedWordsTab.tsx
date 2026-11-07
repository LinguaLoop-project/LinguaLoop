import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { Checkbox } from "@/components/common/Checkbox";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import { playPronunciation } from "@/features/dictionary";
import {
  EMPTY_FILTER,
  filterSavedWords,
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

const SOURCES: SourceFilter[] = ["all", "dictionary", "lesson"];
const STATES: StateFilter[] = ["all", "due", "learning", "mastered"];
const STATUS_TONE: Record<CardStatus, "warning" | "info" | "success" | undefined> = {
  new: undefined,
  learning: "warning",
  reviewing: "info",
  mastered: "success",
};

function StatCard({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className={`text-xs font-bold uppercase tracking-wider ${tone}`}>{label}</span>
      <span className="font-display text-[30px] font-bold leading-none">{value}</span>
      <span className="text-[13px] text-text-muted">{hint}</span>
    </div>
  );
}

interface WordRowProps {
  item: SavedWord;
  selected: boolean;
  onToggle: () => void;
  onUnsave: () => void;
  busy: boolean;
}

function WordRow({ item, selected, onToggle, onUnsave, busy }: WordRowProps) {
  const { t, i18n } = useTranslation("mywords");
  const next = item.due
    ? t("words.next.due")
    : item.nextReviewAt
      ? dateFormatter(i18n.language).format(new Date(item.nextReviewAt))
      : t("words.next.none");
  const tone = STATUS_TONE[item.status];

  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border px-5 py-4 last:border-b-0 ${selected ? "bg-primary-soft" : ""}`}>
      <Checkbox
        containerClassName="flex-none"
        aria-label={t("words.select", { word: item.headword })}
        checked={selected}
        onChange={onToggle}
      />
      <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <b className="text-[17px]">{item.headword}</b>
          {item.cefrLevel && <Badge variant={item.cefrLevel}>{item.cefrLevel}</Badge>}
          {item.ipaUs && <span className="text-sm text-text-muted">{item.ipaUs}</span>}
          {item.pos && <span className="text-xs font-semibold text-text-subtle">{item.pos}</span>}
        </div>
        {item.translationVi && <span>{item.translationVi}</span>}
        {item.source === "lesson" && item.contextEn && (
          <q className="text-[13px] italic text-text-muted">{item.contextEn}</q>
        )}
        <span className="inline-flex flex-wrap items-center gap-1 text-[13px] text-text-muted">
          {item.lesson ? (
            <Link to={`/student/lessons/${item.lesson.slug}`} className="inline-flex items-center gap-1 hover:text-text">
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
      <div className="flex w-[120px] flex-none flex-col items-start gap-1">
        <Badge tone={tone}>{t(`words.status.${item.status}`)}</Badge>
        <span className="text-[13px] text-text-muted">
          {t("words.nextLabel")}: {next}
        </span>
      </div>
      <div className="flex flex-none items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={t("words.listen", { word: item.headword })}
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
          onClick={onUnsave}
        >
          <Icon name="trash-2" />
        </Button>
      </div>
    </li>
  );
}

/** Tab "Từ đã lưu": các nghĩa đã lưu từ từ điển hoặc bài học, kèm trạng thái ôn; tìm, lọc và bỏ lưu (UC-VOCAB-02). */
export default function SavedWordsTab() {
  const { t } = useTranslation("mywords");
  const query = useSavedWords();
  const unsave = useUnsaveWord();
  const [filter, setFilter] = useState<SavedWordFilter>(EMPTY_FILTER);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const all = useMemo(() => query.data ?? [], [query.data]);
  const stats = useMemo(() => savedWordStats(all), [all]);
  const items = useMemo(() => filterSavedWords(all, filter), [all, filter]);
  // Chỉ tính các dòng còn trong danh sách: từ vừa bỏ lưu ở nơi khác thì không còn được chọn.
  const selectedIds = items.filter((item) => selected.has(item.id)).map((item) => item.id);
  const allSelected = items.length > 0 && selectedIds.length === items.length;

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

  return (
    <div className="flex flex-col gap-4">
      <ListState query={query} skeletonRows={4}>
        {all.length === 0 ? (
          <EmptyState title={t("words.emptyTitle")} description={t("words.emptyDesc")} />
        ) : (
          <>
            <div role="group" aria-label={t("words.stats.label")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label={t("words.stats.total")} value={stats.total} hint={t("words.stats.totalHint")} tone="text-primary-text" />
              <StatCard label={t("words.stats.due")} value={stats.due} hint={t("words.stats.dueHint")} tone="text-danger" />
              <StatCard label={t("words.stats.learning")} value={stats.learning} hint={t("words.stats.learningHint")} tone="text-warning" />
              <StatCard label={t("words.stats.mastered")} value={stats.mastered} hint={t("words.stats.masteredHint")} tone="text-success" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={filter.query}
                onChange={(query) => setFilter((current) => ({ ...current, query }))}
                placeholder={t("words.search.placeholder")}
                ariaLabel={t("words.search.aria")}
              />
              <SegmentedControl
                ariaLabel={t("words.source.label")}
                value={filter.source}
                onChange={(value) => setFilter((current) => ({ ...current, source: value as SourceFilter }))}
                options={SOURCES.map((value) => ({ value, label: t(`words.source.${value}`) }))}
              />
              <SegmentedControl
                ariaLabel={t("words.state.label")}
                value={filter.state}
                onChange={(value) => setFilter((current) => ({ ...current, state: value as StateFilter }))}
                options={STATES.map((value) => ({ value, label: t(`words.state.${value}`) }))}
              />
            </div>

            {items.length === 0 ? (
              <EmptyState title={t("words.emptyFilteredTitle")} description={t("words.emptyFilteredDesc")} />
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
                    <span>{t("words.count", { count: items.length })}</span>
                  )}
                </div>
                <ul className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
                  {items.map((item) => (
                    <WordRow
                      key={item.id}
                      item={item}
                      selected={selected.has(item.id)}
                      onToggle={() => toggle(item.id)}
                      onUnsave={() => onUnsaveOne(item)}
                      busy={busyId === item.id}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </ListState>
    </div>
  );
}
