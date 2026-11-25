import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Chip from "@/components/common/Chip";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import { toast } from "@/stores/toastStore";
import { NOTE_MAX_LENGTH } from "../constants";
import { useDeleteNote, useNoteEntries, useSaveNote } from "../hooks";
import { modeUrl } from "../links";
import type { NoteEntry, PracticeMode } from "../types";
import { dateFormatter, isNetworkError } from "../utils";
import ListState from "./ListState";

function NoteCard({ note }: { note: NoteEntry }) {
  const { t, i18n } = useTranslation("mywords");
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note.content);
  const update = useSaveNote(note.mode);
  const remove = useDeleteNote(note.mode);
  const busy = update.isPending || remove.isPending;
  const canSave = value.trim() !== "" && value !== note.content && !busy;

  const failure = (error: unknown) => toast(isNetworkError(error) ? t("offline") : t("notes.failed"), { icon: "circle-alert" });

  const onSave = () =>
    update.mutate(
      { sentenceId: note.sentenceId, content: value },
      {
        onSuccess: () => {
          setEditing(false);
          toast(t("notes.saved"), { icon: "check" });
        },
        onError: failure,
      },
    );

  const onDelete = () =>
    remove.mutate(note.sentenceId, {
      onSuccess: () => toast(t("notes.deleted"), { icon: "trash-2" }),
      onError: failure,
    });

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[11px] font-semibold ${
            note.mode === "shadowing"
              ? "border-fn-shadowing/40 bg-[color-mix(in_srgb,var(--fn-shadowing)_14%,transparent)] text-fn-shadowing"
              : "border-fn-dictation/40 bg-[color-mix(in_srgb,var(--fn-dictation)_14%,transparent)] text-fn-dictation"
          }`}
        >
          <Icon name={note.mode === "shadowing" ? "mic" : "headphones"} className="h-3.5 w-3.5" />
          {t(`review.modes.${note.mode}`)}
        </span>
        <time dateTime={note.updatedAt} className="text-xs text-text-muted">
          {dateFormatter(i18n.language).format(new Date(note.updatedAt))}
        </time>
      </div>
      <q className="rounded-md bg-bg-elevated px-3 py-2 text-sm italic text-text-muted">{note.text}</q>
      {editing ? (
        <textarea
          autoFocus
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          value={value}
          aria-label={t("notes.edit")}
          onChange={(event) => setValue(event.target.value)}
          className="w-full resize-y rounded-md border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-fn-dictation"
        />
      ) : (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{note.content}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
        <Link to={modeUrl(note.mode, note.lessonId, note.sentenceId)} className="inline-flex min-w-0 items-center gap-1.5 text-text-muted transition-colors hover:text-primary-text">
          <Icon name="play" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{note.lessonTitle}</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <Button size="sm" isLoading={update.isPending} disabled={!canSave} onClick={onSave}>
                {t("notes.save")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setValue(note.content);
                  setEditing(false);
                }}
              >
                {t("notes.cancel")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" iconOnly aria-label={t("notes.edit")} title={t("notes.edit")} disabled={busy} onClick={() => setEditing(true)}>
                <Icon name="pencil-line" />
              </Button>
              <Button variant="ghost" size="sm" iconOnly aria-label={t("notes.delete")} title={t("notes.delete")} isLoading={remove.isPending} onClick={onDelete}>
                <Icon name="trash-2" />
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

type ModeFilter = "all" | PracticeMode;
const PAGE_SIZE = 10;

/** Tab "Ghi chú": ghi chú riêng của người học cho từng câu ở từng chế độ, tìm kiếm, lọc theo chế độ/bài học, sửa và xoá tại chỗ. */
export default function NotesTab() {
  const { t } = useTranslation("mywords");
  const query = useNoteEntries();
  const [filter, setFilter] = useState<ModeFilter>("all");
  const [lessonFilter, setLessonFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const all = useMemo(() => query.data ?? [], [query.data]);
  const countOf = (mode: PracticeMode) => all.filter((note) => note.mode === mode).length;

  const lessonChips = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    for (const note of all) {
      const existing = map.get(note.lessonId);
      if (existing) existing.count += 1;
      else map.set(note.lessonId, { id: note.lessonId, title: note.lessonTitle, count: 1 });
    }
    return [...map.values()];
  }, [all]);

  const notes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((note) => {
      if (filter !== "all" && note.mode !== filter) return false;
      if (lessonFilter !== "all" && note.lessonId !== lessonFilter) return false;
      if (!q) return true;
      return `${note.content} ${note.text} ${note.lessonTitle}`.toLowerCase().includes(q);
    });
  }, [all, filter, lessonFilter, search]);

  const totalPages = Math.max(1, Math.ceil(notes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedNotes = notes.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const hasActiveFilter = filter !== "all" || lessonFilter !== "all" || search.trim() !== "";

  const resetFilters = () => {
    setFilter("all");
    setLessonFilter("all");
    setSearch("");
    setPage(0);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">{t("notes.hint")}</p>
      <ListState query={query} skeletonRows={2}>
        {all.length === 0 ? (
          <EmptyState title={t("notes.emptyTitle")} description={t("notes.emptyDesc")} />
        ) : (
          <>
            <div className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
              <SearchInput
                className="w-full min-w-[220px] sm:flex-1"
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(0);
                }}
                placeholder={t("notes.search")}
                ariaLabel={t("notes.search")}
              />
              <SegmentedControl
                ariaLabel={t("notes.filter.label")}
                value={filter}
                onChange={(value) => {
                  setFilter(value as ModeFilter);
                  setPage(0);
                }}
                options={[
                  { value: "all", label: `${t("notes.filter.all")} (${all.length})` },
                  { value: "dictation", label: `${t("review.modes.dictation")} (${countOf("dictation")})` },
                  { value: "shadowing", label: `${t("review.modes.shadowing")} (${countOf("shadowing")})` },
                ]}
              />
            </div>

            {lessonChips.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                <Chip
                  active={lessonFilter === "all"}
                  count={all.length}
                  onClick={() => {
                    setLessonFilter("all");
                    setPage(0);
                  }}
                >
                  {t("notes.allLessons")}
                </Chip>
                {lessonChips.map((lesson) => (
                  <Chip
                    key={lesson.id}
                    active={lessonFilter === lesson.id}
                    count={lesson.count}
                    title={lesson.title}
                    onClick={() => {
                      setLessonFilter(lesson.id);
                      setPage(0);
                    }}
                  >
                    <span className="max-w-[200px] truncate">{lesson.title}</span>
                  </Chip>
                ))}
              </div>
            )}

            {notes.length === 0 ? (
              <EmptyState
                title={t("notes.emptyFilteredTitle")}
                description={t("notes.emptyFilteredDesc")}
                actionText={hasActiveFilter ? t("notes.clearFilters") : undefined}
                onAction={hasActiveFilter ? resetFilters : undefined}
              />
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {pagedNotes.map((note) => (
                    <NoteCard key={`${note.mode}-${note.sentenceId}`} note={note} />
                  ))}
                </ul>
                <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </>
        )}
      </ListState>
    </div>
  );
}
