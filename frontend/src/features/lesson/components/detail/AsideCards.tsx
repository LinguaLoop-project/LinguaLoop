import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import ProgressRing from "@/components/common/ProgressRing";
import {
  displayGroups,
  mainPronunciation,
  playPronunciation,
  useWordLookup,
} from "@/features/dictionary";
import { modeUrl, useNoteEntries, type NoteEntry } from "@/features/practice";
import { findSaved, useSaveWord, useSavedWords, useUnsaveWord } from "@/features/vocab";
import { formatDuration } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import type { LessonSummary, ModeProgress, SentenceResponse } from "../../types";
import LessonThumb from "../LessonThumb";
import { compactIpa, extractCandidateWords, FUNCTION_POS } from "../../vocabCandidates";

const OVERLINE = "text-[14px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text";

function AsideCard({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className={OVERLINE}>{title}</div>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** Tiến độ tổng (trung bình hai chế độ) và từng chế độ kèm thanh tiến độ mini. */
export function ProgressCard({ progress, sentenceCount = 0 }: { progress: ModeProgress; sentenceCount?: number }) {
  const { t } = useTranslation("pages");
  const overall = Math.round((progress.dictationPercent + progress.shadowingPercent) / 2);
  const dDone = Math.round((sentenceCount * progress.dictationPercent) / 100);
  const sDone = Math.round((sentenceCount * progress.shadowingPercent) / 100);

  return (
    <AsideCard title={t("student.lessonDetail.aside.progress", "Tiến độ của bạn")}>
      <div className="mt-4 flex items-center gap-4">
        <ProgressRing value={overall} size={88} label="%" ariaLabel={t("student.lessonDetail.aside.progress", "Tiến độ của bạn")} />
        <div className="flex min-w-0 flex-1 flex-col gap-3 text-[13px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-fn-dictation [&>svg]:h-4 [&>svg]:w-4">
                <Icon name="headphones" />
                {t("student.lessonDetail.dictation.title", "Nghe chép")}
              </span>
              <b className="tabular-nums text-text">
                {sentenceCount > 0 ? `${dDone}/${sentenceCount}` : ""} ({Math.round(progress.dictationPercent)}%)
              </b>
            </div>
            <ProgressBar value={progress.dictationPercent} tone="dictation" thin label="Dictation" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-fn-shadowing [&>svg]:h-4 [&>svg]:w-4">
                <Icon name="mic" />
                {t("student.lessonDetail.shadowing.title", "Shadowing")}
              </span>
              <b className="tabular-nums text-text">
                {sentenceCount > 0 ? `${sDone}/${sentenceCount}` : ""} ({Math.round(progress.shadowingPercent)}%)
              </b>
            </div>
            <ProgressBar value={progress.shadowingPercent} tone="shadowing" thin label="Shadowing" />
          </div>
        </div>
      </div>
    </AsideCard>
  );
}


function VocabWordRow({
  word,
  sentenceId,
  fallbackMeaning,
}: {
  word: string;
  sentenceId?: string;
  fallbackMeaning?: string;
}) {
  const { t } = useTranslation("dictionary");
  const lookup = useWordLookup(word);
  const savedList = useSavedWords();
  const saveWord = useSaveWord();
  const unsaveWord = useUnsaveWord();

  const view = lookup.data;
  const targetHeadword = (view?.lemma?.headword ?? view?.headword ?? word).toLowerCase();
  const groups = view ? displayGroups(view) : [];

  const isGoodMeaning = (text?: string | null) => {
    const trimmed = (text ?? "").trim();
    return trimmed.length > 0 && !/^xem\s+/i.test(trimmed) && !/^\([A-Z]/.test(trimmed);
  };

  // Ưu tiên nhóm từ loại thực từ (danh/động/tính/trạng từ) và nghĩa thông dụng (không phải "xem ..." hay chú thích tên riêng "(Sound)...")
  const preferredGroup =
    groups.find(
      (g) =>
        !FUNCTION_POS.has((g.pos ?? "").toLowerCase()) &&
        g.meanings.some((m) => isGoodMeaning(m.translationVi)),
    ) ??
    groups.find((g) => !FUNCTION_POS.has((g.pos ?? "").toLowerCase())) ??
    groups[0];

  const preferredMeaning =
    preferredGroup?.meanings.find((m) => isGoodMeaning(m.translationVi)) ??
    preferredGroup?.meanings.find((m) => !/^xem\s+/i.test((m.translationVi ?? "").trim())) ??
    preferredGroup?.meanings[0];

  const meaningNo = preferredMeaning?.no ?? 1;
  const meaningText = preferredMeaning?.translationVi ?? fallbackMeaning;
  const pos = preferredGroup?.pos;
  const pron = view ? mainPronunciation(view) : null;
  const primaryIpa = compactIpa(pron?.ipaUs);
  const savedItem = findSaved(savedList.data, targetHeadword, meaningNo);
  const isSaved = Boolean(savedItem);

  // Ẩn từ không có trong từ điển, hoặc đại từ/hư từ chỉ có nghĩa tham chiếu "xem ..."
  if (lookup.isError && !fallbackMeaning) return null;
  if (view && preferredGroup && FUNCTION_POS.has((preferredGroup.pos ?? "").toLowerCase())) return null;
  if (meaningText && /^xem\s+/i.test(meaningText.trim()) && groups.length <= 1) return null;

  const handleToggleSave = () => {
    if (savedItem) {
      unsaveWord.mutate(savedItem.id, {
        onSuccess: () => toast(t("save.removedToast"), { icon: "bookmark" }),
      });
    } else if (preferredMeaning) {
      saveWord.mutate(
        { headword: targetHeadword, meaningNo, sentenceId },
        {
          onSuccess: () => toast(t("save.savedToast", { word: targetHeadword }), { icon: "bookmark-check" }),
        },
      );
    }
  };

  return (
    <div className="grid grid-cols-[32px_minmax(0,1fr)_32px] items-start gap-2.5 border-b border-border py-2.5 last:border-b-0">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        className="mt-0.5 h-8 w-8 shrink-0"
        aria-label={`Nghe ${targetHeadword}`}
        onClick={() => playPronunciation(targetHeadword, "us", pron?.audioUs ?? null)}
      >
        <Icon name="volume-2" />
      </Button>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <Link
            to={`/student/dictionary/${encodeURIComponent(targetHeadword)}`}
            className="max-w-full truncate font-bold text-text transition-colors hover:text-primary-text"
          >
            {targetHeadword}
          </Link>
          {pos && (
            <span className="shrink-0 rounded-full border border-border bg-bg-elevated px-1.5 py-0.2 text-[10px] font-semibold text-text-muted">
              {t(`pos.${pos}`, { defaultValue: pos })}
            </span>
          )}
          {primaryIpa && (
            <span className="max-w-full truncate font-mono text-[11px] text-text-muted">{primaryIpa}</span>
          )}
        </div>
        {meaningText && (
          <div className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-text-muted">{meaningText}</div>
        )}
      </div>

      {preferredMeaning ? (
        <button
          type="button"
          aria-pressed={isSaved}
          aria-label={t(isSaved ? "save.unsaveAria" : "save.saveAria", { word: targetHeadword })}
          disabled={saveWord.isPending || unsaveWord.isPending}
          onClick={handleToggleSave}
          className={`mt-0.5 grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-sm border-0 bg-transparent transition-colors hover:bg-surface-hover ${
            isSaved ? "text-fn-vocab" : "text-text-subtle hover:text-text"
          }`}
        >
          <Icon name="bookmark" fill={isSaved} />
        </button>
      ) : (
        <span className="h-8 w-8 shrink-0" aria-hidden="true" />
      )}
    </div>
  );
}

export function VocabCard({
  sentences = [],
  lessonTitle = "",
  loading = false,
}: {
  sentences?: SentenceResponse[];
  lessonTitle?: string;
  loading?: boolean;
}) {
  const { t } = useTranslation("pages");
  const candidates = useMemo(
    () => extractCandidateWords(sentences, lessonTitle, loading),
    [sentences, lessonTitle, loading],
  );

  return (
    <AsideCard title={t("student.lessonDetail.aside.vocab", "Từ vựng trong bài")}>
      <div className="mt-2">
        {candidates.map((c) => (
          <VocabWordRow
            key={c.word}
            word={c.word}
            sentenceId={c.sentenceId}
            fallbackMeaning={c.fallbackMeaning}
          />
        ))}
      </div>
    </AsideCard>
  );
}

/** Số ghi chú hiện sẵn ở thẻ; phần còn lại xem trong hộp "Xem thêm" để trang không dài ra theo số ghi chú. */
const NOTES_PREVIEW = 3;

function NoteItem({ note, slug }: { note: NoteEntry; slug: string }) {
  const { t } = useTranslation("pages");
  return (
    <li>
      <Link to={modeUrl(note.mode, slug, note.sentenceId)} className="block rounded-md border border-border bg-bg-elevated p-3 hover:border-border-strong">
        <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-border px-2 text-[11px] text-text-muted">
          <Icon name={note.mode === "shadowing" ? "mic" : "headphones"} className="h-3 w-3" />
          {t(`student.lessonDetail.aside.modes.${note.mode}`, note.mode === "shadowing" ? "Shadowing" : "Nghe chép")}
        </span>
        <q className="line-clamp-2 block text-xs italic text-text-muted">{note.text}</q>
        <span className="mt-1 block whitespace-pre-wrap break-words text-[13px]">{note.content}</span>
      </Link>
    </li>
  );
}

export function NotesCard({ slug, locked }: { slug: string; locked: boolean }) {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const notesQuery = useNoteEntries(slug, !locked);
  const notes = locked ? [] : (notesQuery.data ?? []);
  const hidden = notes.length - NOTES_PREVIEW;
  return (
    <AsideCard
      title={`${t("student.lessonDetail.aside.notes", "Ghi chú của tôi")}${notes.length > 0 ? ` (${notes.length})` : ""}`}
      aside={
        locked ? undefined : (
          <Button variant="text" size="sm" leftIcon={<Icon name="plus" />} onClick={() => navigate(`/student/dictation/${slug}`)}>
            {t("student.lessonDetail.aside.add", "Thêm")}
          </Button>
        )
      }
    >
      {notes.length > 0 ? (
        <>
          <ul className="mt-3 flex flex-col gap-3">
            {notes.slice(0, NOTES_PREVIEW).map((note) => (
              <NoteItem key={`${note.mode}-${note.sentenceId}`} note={note} slug={slug} />
            ))}
          </ul>
          {hidden > 0 && (
            <Button variant="ghost" size="sm" className="mt-3 w-full justify-center" aria-haspopup="dialog" onClick={() => setShowAll(true)}>
              {t("student.lessonDetail.aside.moreNotes", { count: hidden, defaultValue: `Xem thêm ${hidden} ghi chú` })}
              <Icon name="chevron-right" />
            </Button>
          )}
          <Dialog open={showAll} onClose={() => setShowAll(false)} labelledBy="lesson-notes-title" wide>
            <div className="flex items-center justify-between gap-3">
              <h2 id="lesson-notes-title" className="text-lg font-bold">
                {t("student.lessonDetail.aside.allNotes", { count: notes.length, defaultValue: `Ghi chú của tôi (${notes.length})` })}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAll(false)}>
                {t("student.lessonDetail.aside.close", "Đóng")}
              </Button>
            </div>
            <ul className="mt-4 flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
              {notes.map((note) => (
                <NoteItem key={`${note.mode}-${note.sentenceId}`} note={note} slug={slug} />
              ))}
            </ul>
          </Dialog>
        </>
      ) : (
        <p className="mt-2 text-[13px] leading-normal text-text-muted">
          {t("student.lessonDetail.aside.noNotesBefore", "Chưa có ghi chú. Trong lúc luyện, bấm")}{" "}
          <kbd className="rounded-md border border-border-strong bg-bg-elevated px-1.5 py-1 font-body text-[11px] font-semibold leading-none text-text-muted">N</kbd>{" "}
          {t("student.lessonDetail.aside.noNotesAfter", "để ghi chú cho câu đang học.")}
        </p>
      )}
    </AsideCard>
  );
}

export function RelatedLessons({ lessons, topicSlug }: { lessons: LessonSummary[]; topicSlug: string; topicName?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  return (
    <AsideCard title={t("student.lessonDetail.related.title", "Bài cùng chủ đề")}>
      <div className="mt-2 flex flex-col gap-1">
        {lessons.map((rel) => (
          <div
            key={rel.id}
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/student/lessons/${rel.id}`)}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/student/lessons/${rel.id}`)}
            className="group -mx-2.5 grid cursor-pointer grid-cols-[40%_minmax(0,1fr)] items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-surface-hover/70"
          >
            <LessonThumb lesson={rel} corners={false} compact className="w-full rounded-sm" />
            <div className="flex min-w-0 flex-col gap-1">
              <b className="line-clamp-2 text-[13px] font-bold leading-[1.35] transition-colors group-hover:text-primary-text">
                {rel.title}
              </b>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                {rel.cefrLevel && <Badge variant={rel.cefrLevel}>{rel.cefrLevel}</Badge>}
                <span className="tabular-nums">{formatDuration(rel.durationSec || 0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button variant="text" size="sm" className="mt-2" onClick={() => navigate(topicSlug ? `/student/topics/${topicSlug}` : "/student/lessons")}>
        {topicSlug ? t("student.lessonDetail.related.viewTopic", "Xem cả chủ đề") : t("student.lessonDetail.related.exploreLessons", "Khám phá thêm bài học")}
        <Icon name="arrow-right" />
      </Button>
    </AsideCard>
  );
}
