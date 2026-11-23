import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import { TakedownNotice, useIsTakenDown } from "@/features/report";
import { toast } from "@/stores/toastStore";
import { lessonActions, type LessonAction } from "../actions";
import { errorMessage } from "../errors";
import { lessonManageKeys, useSuggest, useUpdateSentences } from "../hooks";
import { ADMIN_LESSONS_PATH, TEACHER_LESSONS_PATH } from "../paths";
import {
  changeCount,
  collectChanges,
  isRowChanged,
  mergeWithNext,
  nextAlive,
  serverErrors,
  splitRow,
  toDraft,
  validateDraft,
  type DraftErrors,
  type DraftRow,
  type SuggestMode,
} from "../sentenceDraft";
import { formatDate, parseMs } from "../time";
import type { LessonApiError, LessonDetail, ManageRole, SentenceFieldError, SuggestionResult } from "../types";
import { useSegmentPlayer } from "../useSegmentPlayer";
import LessonActionDialog from "./LessonActionDialog";
import LessonInfoDialog from "./LessonInfoDialog";
import { MetaChip, StatusBadge } from "./LessonBits";
import SentenceCard from "./SentenceCard";
import SuggestDialog from "./SuggestDialog";

const ACTION_ICONS: Record<LessonAction, string> = {
  publish: "send",
  unpublish: "eye-off",
  delete: "trash-2",
  restore: "rotate-ccw",
};

type PlayMode = "autoStop" | "continuous";

const NO_ERRORS: DraftErrors[string] = {};

let newKey = 0;

const timesOf = (row: DraftRow) => ({ start: parseMs(row.start), end: parseMs(row.end) });

/**
 * Trang bài học (UC-BH-02, UC-BH-05, UC-BH-10): thông tin và thao tác bài ở trên; trái là video với nút câu trước, phát,
 * câu sau và chế độ phát; phải là các câu. Giáo viên chủ bài sửa câu ngay trên thẻ, lưu một lần ở thanh dưới; quản trị
 * viên chỉ xem. Nghe thử không ghi nhận tiến độ (BR-BH-15).
 */
export default function LessonWorkspace({ role, lesson }: Readonly<{ role: ManageRole; lesson: LessonDetail }>) {
  const { t, i18n } = useTranslation("lessonManage");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editable = role === "teacher";
  // Khung "Bị quản trị viên gỡ" đã nêu lý do gỡ, nên không lặp lại dòng "Quản trị viên đã gỡ xuất bản".
  const takenDown = useIsTakenDown("lesson", editable ? lesson.id : undefined);
  const listPath = role === "teacher" ? TEACHER_LESSONS_PATH : ADMIN_LESSONS_PATH;

  const [rows, setRows] = useState<DraftRow[]>(() => toDraft(lesson.sentences));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // Có thể mở nhiều thẻ cùng lúc: tách câu mở cả hai phần để nhập mốc tách.
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<PlayMode>("autoStop");
  const [pending, setPending] = useState<LessonAction | null>(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [seekedId, setSeekedId] = useState<string | null>(null);
  // Các câu AI chưa gợi ý được ở lần gần nhất, để "Thử lại" đúng những câu đó (UC-BH-10 4b).
  const [suggestRetry, setSuggestRetry] = useState<{ ids: string[]; mode: SuggestMode } | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const save = useUpdateSentences(lesson.id);
  const retrySuggest = useSuggest(lesson.id);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const player = useSegmentPlayer(lesson.youtubeId, playerRef);
  const { play, playThrough, stop } = player;
  const originals = useMemo(() => new Map(lesson.sentences.map((s) => [s.id, s])), [lesson.sentences]);
  const pendingChanges = editable ? changeCount(rows, lesson.sentences) : 0;
  const dirty = pendingChanges > 0;
  const alive = rows.filter((r) => !r.deleted);

  // Câu đang phát theo vị trí video; dừng rồi thì giữ câu vừa phát hoặc vừa bấm tới.
  const activeId = useMemo(() => {
    if (player.playingKey && player.positionMs !== null) {
      const now = player.positionMs;
      const hit = alive.find((r) => {
        const { start, end } = timesOf(r);
        return start !== null && end !== null && now >= start && now < end;
      });
      if (hit) return hit.id;
    }
    return seekedId;
  }, [alive, player.playingKey, player.positionMs, seekedId]);

  // Phát liên tục: thẻ của câu đang phát luôn nằm trong tầm nhìn (trừ khi đang sửa một câu).
  useEffect(() => {
    if (mode !== "continuous" || !player.playingKey || !activeId || editing.size > 0) return;
    document.getElementById(`sentence-${activeId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId, mode, player.playingKey, editing]);

  // Đóng tab hoặc tải lại trang khi còn thay đổi chưa lưu (UC-BH-05 3c).
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = useCallback(
    (id: string, patch: Partial<DraftRow>) => setRows((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    [],
  );
  const toggleEdit = useCallback(
    (id: string) =>
      setEditing((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );
  const canRestructure = editable && !lesson.structureLocked;
  // Bản mới nhất của các câu cho tách câu: cần biết ngay có tách được không để báo, mà vẫn giữ hàm ổn định cho thẻ câu.
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);
  const split = useCallback(
    (id: string, cursor: number) => {
      newKey += 1;
      const key = `new-${newKey}`;
      const next = splitRow(rowsRef.current, id, cursor, key);
      if (!next) {
        toast(t("workspace.splitInvalid"), { icon: "info" });
        return;
      }
      setRows(next);
      setEditing((current) => new Set(current).add(id).add(key));
    },
    [t],
  );
  const merge = useCallback((id: string) => {
    setRows((current) => mergeWithNext(current, id) ?? current);
  }, []);
  const toggleSelect = useCallback(
    (id: string) =>
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );

  /** Phát câu theo chế độ đang chọn; bấm lại câu đang phát thì dừng. */
  const playRow = useCallback(
    (row: DraftRow, playing = false) => {
      if (playing) {
        stop();
        return;
      }
      const { start, end } = timesOf(row);
      if (start === null) return;
      setSeekedId(row.id);
      if (mode === "continuous") playThrough(row.id, start);
      else if (end !== null && start < end) play(row.id, start, end);
    },
    [play, playThrough, stop, mode],
  );

  const step = (delta: number) => {
    const index = Math.max(0, alive.findIndex((r) => r.id === activeId));
    const target = alive[Math.min(alive.length - 1, Math.max(0, activeId ? index + delta : 0))];
    if (!target) return;
    playRow(target);
    document.getElementById(`sentence-${target.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const leave = () => (dirty ? setConfirmLeave(true) : navigate(listPath));

  const discard = () => {
    setRows(toDraft(lesson.sentences));
    setErrors({});
    setFormError(null);
    setEditing(new Set());
    setSuggestRetry(null);
  };

  const onSave = () => {
    setFormError(null);
    const found = validateDraft(rows, lesson.durationSec * 1000);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(t("sentences.fixErrors"));
      const first = rows.find((r) => found[r.id]);
      if (first) {
        setEditing((current) => new Set(current).add(first.id));
        document.getElementById(`sentence-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const { sentences, deletedIds, added } = collectChanges(rows, lesson.sentences);
    save.mutate(
      { sentences, deletedIds, added },
      {
        onSuccess: (saved) => {
          queryClient.setQueryData(lessonManageKeys.detail("teacher", lesson.id), saved);
          setRows(toDraft(saved.sentences));
          setEditing(new Set());
          setSelected(new Set());
          toast(t("sentences.saved"), { icon: "circle-check" });
        },
        onError: (error) => {
          const e = error as unknown as LessonApiError;
          if (e.code === "LESSON_SENTENCES_INVALID") {
            setErrors(serverErrors((e.details.errors as SentenceFieldError[] | undefined) ?? []));
            setFormError(t("sentences.fixErrors"));
            return;
          }
          setFormError(errorMessage(t, e));
        },
      },
    );
  };

  /** Điền gợi ý vào ô, chưa lưu (UC-BH-10 Bước 5). "Chỉ ô còn trống" không đổi ô đã có nội dung. */
  const applySuggestions = (result: SuggestionResult, suggestMode: SuggestMode) => {
    const byId = new Map(result.sentences.map((s) => [s.id, s]));
    setRows((current) =>
      current.map((row) => {
        const s = byId.get(row.id);
        if (!s) return row;
        const next = { ...row };
        if (s.textVi && (suggestMode === "overwrite" || row.textVi.trim() === "")) next.textVi = s.textVi;
        return next;
      }),
    );
    // Tính theo từng câu thay vì chỉ dựa vào kết quả chung: AI có thể bỏ sót vài câu mà không báo lỗi.
    const missing = result.sentences.filter((s) => !s.textVi).map((s) => s.id);
    setSuggestRetry(missing.length > 0 ? { ids: missing, mode: suggestMode } : null);
    setRetryError(null);
    const credit =
      result.creditsCharged > 0
        ? t("suggest.charged", { charged: result.creditsCharged, balance: result.creditBalance })
        : "";
    toast(`${t("suggest.translated", { count: result.translatedCount })}${credit}`, {
      icon: missing.length > 0 ? "triangle-alert" : "sparkles",
    });
  };

  /** Gợi ý lại cho các câu lần trước AI chưa gợi ý được, cùng cách điền. */
  const retryMissing = () => {
    if (!suggestRetry) return;
    const ids = new Set(suggestRetry.ids);
    const targets = rows.filter((r) => ids.has(r.id) && !r.deleted && r.textEn.trim() !== "");
    if (targets.length === 0) {
      setSuggestRetry(null);
      return;
    }
    setRetryError(null);
    retrySuggest.mutate(
      { sentences: targets.map((r) => ({ id: r.id, textEn: r.textEn.trim() })), translation: true, ipa: false },
      {
        onSuccess: (result) => applySuggestions(result, suggestRetry.mode),
        onError: (e) => setRetryError(errorMessage(t, e)),
      },
    );
  };

  /** Bài chưa đủ điều kiện xuất bản: mở câu đầu tiên còn thiếu bản dịch (UC-BH-06 2a). */
  const openFirstMissing = () => {
    setPending(null);
    const first = alive.find((r) => r.textVi.trim() === "");
    if (!first) return;
    setEditing((current) => new Set(current).add(first.id));
    requestAnimationFrame(() =>
      document.getElementById(`sentence-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };

  const errorText = useCallback(
    (code: string | undefined) => (code ? t(`sentences.error.${code}`, { defaultValue: code }) : undefined),
    [t],
  );
  const actions = lessonActions({ status: lesson.status, deletedAt: null }, role);
  const canPlay = player.status === "ready";

  return (
    <div className="flex flex-col gap-5 pb-4">
      <Button variant="text" size="sm" className="self-start" onClick={leave} leftIcon={<Icon name="arrow-left" />}>
        {t("detail.backToList")}
      </Button>

      <header className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-text">{lesson.title}</h1>
              <StatusBadge status={lesson.status} label={t(`status.${lesson.status}`)} />
              {lesson.pro && (
                <Badge variant="pro">
                  <Icon name="crown" />
                  Pro
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
              <MetaChip icon="folders">{lesson.topicName ?? "—"}</MetaChip>
              <MetaChip icon="graduation-cap">{lesson.cefrLevel}</MetaChip>
              <MetaChip icon="list-video">{t("list.sentenceCount", { count: alive.length })}</MetaChip>
              {role === "admin" && lesson.ownerName && <MetaChip icon="user">{lesson.ownerName}</MetaChip>}
              <MetaChip icon="calendar">{t("detail.createdOn", { date: formatDate(lesson.createdAt, i18n.language) })}</MetaChip>
              <MetaChip icon="clock">{t("list.updatedOn", { date: formatDate(lesson.updatedAt, i18n.language) })}</MetaChip>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {editable && (
              <Button variant="secondary" size="sm" onClick={() => setEditingInfo(true)} leftIcon={<Icon name="pencil-line" />}>
                {t("detail.editInfo")}
              </Button>
            )}
            {actions.map((action) => {
              // Xuất bản hay gỡ dùng nội dung đã lưu, nên phải lưu các câu đang sửa trước.
              const blocked = dirty && action !== "delete";
              return (
                <Button
                  key={action}
                  size="sm"
                  variant={action === "delete" ? "danger" : action === "publish" ? "primary" : "secondary"}
                  disabled={blocked}
                  title={blocked ? t("workspace.saveFirst") : undefined}
                  onClick={() => setPending(action)}
                  leftIcon={<Icon name={ACTION_ICONS[action]} />}
                >
                  {t(`action.${action}`)}
                </Button>
              );
            })}
          </div>
        </div>
        {/* Bài bị quản trị viên gỡ: lý do, câu bị báo đã sửa chưa và nút gửi yêu cầu duyệt xuất bản lại (UC-BH-06 2b, 2c).
            Mốc cập nhật đổi sau mỗi lần lưu câu nên khung tự tải lại trạng thái "Đã sửa". */}
        {editable && <TakedownNotice targetType="lesson" targetId={lesson.id} contentVersion={lesson.updatedAt} />}
        {editable && !takenDown && lesson.unpublishReason && lesson.status === "draft" && (
          <FormAlert variant="warning">{t("list.unpublishedByAdmin", { reason: lesson.unpublishReason })}</FormAlert>
        )}
        {editable && lesson.status === "published" && (
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <Icon name="info" className="size-3.5" />
            {t("sentences.publishedNote")}
          </p>
        )}
      </header>

      {confirmLeave && (
        <FormAlert variant="warning">
          <p>{t("sentences.leaveBody")}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setConfirmLeave(false)}>
              {t("info.keepEditing")}
            </Button>
            <Button size="sm" variant="danger" onClick={() => navigate(listPath)}>
              {t("info.discard")}
            </Button>
          </div>
        </FormAlert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          <div
            ref={playerRef}
            className="aspect-video w-full overflow-hidden rounded-2xl bg-bg-elevated [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full"
          />
          {player.status === "failed" && <FormAlert variant="warning">{t("detail.videoUnavailable")}</FormAlert>}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-2">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" iconOnly disabled={!canPlay} aria-label={t("workspace.prev")} title={t("workspace.prev")} onClick={() => step(-1)}>
                <Icon name="skip-back" />
              </Button>
              <Button
                size="sm"
                iconOnly
                disabled={!canPlay || alive.length === 0}
                aria-label={player.playingKey ? t("detail.stop") : t("detail.listen")}
                title={player.playingKey ? t("detail.stop") : t("detail.listen")}
                onClick={() => {
                  if (player.playingKey) player.stop();
                  else {
                    const current = alive.find((r) => r.id === activeId) ?? alive[0];
                    if (current) playRow(current);
                  }
                }}
              >
                <Icon name={player.playingKey ? "pause" : "play"} />
              </Button>
              <Button size="sm" variant="ghost" iconOnly disabled={!canPlay} aria-label={t("workspace.next")} title={t("workspace.next")} onClick={() => step(1)}>
                <Icon name="skip-forward" />
              </Button>
            </div>
            <div className="flex rounded-lg bg-bg-elevated p-0.5" role="radiogroup" aria-label={t("workspace.mode")}>
              {(["autoStop", "continuous"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    mode === m ? "bg-[var(--btn-primary)] text-white" : "text-text-muted hover:text-text"
                  }`}
                >
                  <Icon name={m === "autoStop" ? "repeat-1" : "list-video"} className="size-3.5" />
                  {t(`workspace.${m}`)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-text-subtle">{t(editable ? "workspace.hintTeacher" : "workspace.hintAdmin")}</p>
          {editable && (
            <Button variant="secondary" onClick={() => setSuggesting(true)} leftIcon={<Icon name="wand-sparkles" />}>
              {selected.size > 0 ? t("workspace.suggestSelected", { count: selected.size }) : t("suggest.open")}
            </Button>
          )}
          <a className="w-fit truncate text-xs text-text-subtle underline" href={lesson.youtubeUrl} target="_blank" rel="noreferrer">
            {lesson.youtubeUrl}
          </a>
        </aside>

        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="sentences-heading">
          <div className="flex items-center justify-between gap-2">
            <h2 id="sentences-heading" className="text-lg font-bold text-text">
              {t("workspace.sentences", { count: alive.length })}
            </h2>
            {editable && selected.size > 0 && (
              <Button size="sm" variant="text" onClick={() => setSelected(new Set())}>
                {t("workspace.clearSelection")}
              </Button>
            )}
          </div>
          {formError && <FormAlert variant="danger">{formError}</FormAlert>}
          {editable && suggestRetry && (
            <FormAlert variant="warning">
              <p>{t("suggest.missing", { count: suggestRetry.ids.length })}</p>
              {retryError && <p className="mt-1 text-danger">{retryError}</p>}
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={retryMissing} isLoading={retrySuggest.isPending} leftIcon={<Icon name="rotate-ccw" />}>
                  {t("suggest.retry")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSuggestRetry(null)} disabled={retrySuggest.isPending}>
                  {t("suggest.dismiss")}
                </Button>
              </div>
            </FormAlert>
          )}
          {editable && lesson.structureLocked && (
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <Icon name="lock" className="size-3.5" />
              {t("workspace.structureLocked")}
            </p>
          )}
          {rows.length === 0 ? (
            <p className="text-sm text-text-muted">{t("detail.noSentences")}</p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {rows.map((row) => {
                const index = alive.indexOf(row);
                return (
                  <SentenceCard
                    key={row.id}
                    row={row}
                    index={index < 0 ? rows.indexOf(row) : index}
                    editable={editable}
                    editing={editing.has(row.id)}
                    active={activeId === row.id}
                    playing={player.playingKey === row.id}
                    changed={editable && isRowChanged(row, originals.get(row.id))}
                    selected={selected.has(row.id)}
                    canPlay={canPlay}
                    errors={errors[row.id] ?? NO_ERRORS}
                    errorText={errorText}
                    onUpdate={update}
                    onToggleEdit={toggleEdit}
                    onToggleSelect={toggleSelect}
                    onPlay={playRow}
                    canSplit={canRestructure}
                    canMerge={canRestructure && !row.deleted && nextAlive(rows, row.id) !== null}
                    onSplit={split}
                    onMerge={merge}
                  />
                );
              })}
            </ol>
          )}
        </section>
      </div>

      {editable && dirty && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-strong bg-surface p-3 shadow-lg">
          <span className="text-sm font-semibold text-text">{t("workspace.unsaved", { count: pendingChanges })}</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={discard} disabled={save.isPending}>
              {t("info.discard")}
            </Button>
            <Button onClick={onSave} isLoading={save.isPending} leftIcon={<Icon name="save" />}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {pending && (
        <LessonActionDialog
          role={role}
          action={pending}
          lesson={lesson}
          onClose={() => setPending(null)}
          onDone={(action) => action === "delete" && navigate(listPath)}
          onEditSentences={editable ? openFirstMissing : undefined}
        />
      )}
      {editingInfo && <LessonInfoDialog lesson={lesson} onClose={() => setEditingInfo(false)} />}
      {suggesting && (
        <SuggestDialog
          lessonId={lesson.id}
          rows={rows}
          selected={selected}
          onClose={() => setSuggesting(false)}
          onApply={applySuggestions}
        />
      )}
    </div>
  );
}
