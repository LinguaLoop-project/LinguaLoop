import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import SegmentedControl from "@/components/common/SegmentedControl";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { NOTE_MAX_LENGTH } from "../constants";
import { useDeleteNote, useNoteEntries, useSaveNote } from "../hooks";
import type { NoteEntry, PracticeMode } from "../types";
import { modeUrl } from "../links";
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
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-[22px] items-center gap-1 rounded-full border border-border px-2 text-[11px]">
          <Icon name={note.mode === "shadowing" ? "mic" : "headphones"} className="h-3.5 w-3.5" />
          {t(`review.modes.${note.mode}`)}
        </span>
      </div>
      <q className="text-sm italic text-text-muted">{note.text}</q>
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
        <p className="whitespace-pre-wrap break-words">{note.content}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={modeUrl(note.mode, note.lessonId, note.sentenceId)} className="inline-flex items-center gap-1 text-text-muted hover:text-text">
          <Icon name="play" className="h-3.5 w-3.5" />
          {note.lessonTitle}
        </Link>
        <time dateTime={note.updatedAt} className="text-text-muted">
          {dateFormatter(i18n.language).format(new Date(note.updatedAt))}
        </time>
      </div>
      <div className="flex items-center gap-2">
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
            <Button variant="ghost" iconOnly aria-label={t("notes.edit")} disabled={busy} onClick={() => setEditing(true)}>
              <Icon name="pencil-line" />
            </Button>
            <Button variant="ghost" iconOnly aria-label={t("notes.delete")} isLoading={remove.isPending} onClick={onDelete}>
              <Icon name="trash-2" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

type ModeFilter = "all" | PracticeMode;

/** Tab "Ghi chú": ghi chú riêng của người học cho từng câu ở từng chế độ, lọc theo chế độ, sửa và xoá tại chỗ. */
export default function NotesTab() {
  const { t } = useTranslation("mywords");
  const query = useNoteEntries();
  const [filter, setFilter] = useState<ModeFilter>("all");
  const all = query.data ?? [];
  const notes = filter === "all" ? all : all.filter((note) => note.mode === filter);
  const countOf = (mode: PracticeMode) => all.filter((note) => note.mode === mode).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{t("notes.hint")}</p>
        {all.length > 0 && (
          <SegmentedControl
            ariaLabel={t("notes.filter.label")}
            value={filter}
            onChange={(value) => setFilter(value as ModeFilter)}
            options={[
              { value: "all", label: `${t("notes.filter.all")} (${all.length})` },
              { value: "dictation", label: `${t("review.modes.dictation")} (${countOf("dictation")})` },
              { value: "shadowing", label: `${t("review.modes.shadowing")} (${countOf("shadowing")})` },
            ]}
          />
        )}
      </div>
      <ListState query={query} skeletonRows={2}>
        {notes.length === 0 ? (
          <EmptyState title={t("notes.emptyTitle")} description={t("notes.emptyDesc")} />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {notes.map((note) => (
              <NoteCard key={`${note.mode}-${note.sentenceId}`} note={note} />
            ))}
          </ul>
        )}
      </ListState>
    </div>
  );
}
