import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { shiftTime, type DraftField, type DraftRow } from "../sentenceDraft";

const NUDGE_MS = 100;

export interface SentenceCardProps {
  row: DraftRow;
  index: number;
  /** Giáo viên chủ bài: sửa, xóa, chọn câu để gợi ý. Quản trị viên chỉ xem. */
  editable: boolean;
  editing: boolean;
  active: boolean;
  playing: boolean;
  changed: boolean;
  selected: boolean;
  canPlay: boolean;
  errors: Partial<Record<DraftField, string>>;
  errorText: (code: string | undefined) => string | undefined;
  onUpdate: (id: string, patch: Partial<DraftRow>) => void;
  onToggleEdit: (id: string) => void;
  onToggleSelect: (id: string) => void;
  /** Phát câu; `playing` = câu này đang phát thì dừng. */
  onPlay: (row: DraftRow, playing: boolean) => void;
  /** Tách, gộp được (bài chưa từng xuất bản, BR-BH-13). `canMerge`: còn câu ngay sau để gộp. */
  canSplit: boolean;
  canMerge: boolean;
  onSplit: (id: string, cursor: number) => void;
  onMerge: (id: string) => void;
}

/**
 * Một câu trên trang bài học: mặc định chỉ đọc (câu tiếng Anh, bản dịch, mốc; IPA do server tạo nên không hiện), bấm "Sửa" thì mở ô nhập ngay trong
 * thẻ (UC-BH-05). Xóa chỉ đánh dấu, áp dụng khi Lưu, nên hoàn tác được.
 */
function SentenceCard(props: Readonly<SentenceCardProps>) {
  const { row, index, editable, editing, active, playing, changed, selected, canPlay, errors, errorText } = props;
  const { t } = useTranslation("lessonManage");
  const [splitting, setSplitting] = useState(false);
  const hasError = Object.keys(errors).length > 0;

  if (row.deleted) {
    return (
      <li className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-danger bg-surface px-3 py-2 text-sm">
        <span className="font-semibold text-text-muted line-through">#{index + 1}</span>
        <span className="min-w-0 flex-1 truncate text-text-muted line-through">{row.textEn}</span>
        <span className="text-xs text-danger">{t("workspace.willDelete")}</span>
        <Button size="sm" variant="ghost" leftIcon={<Icon name="rotate-ccw" />} onClick={() => props.onUpdate(row.id, { deleted: false })}>
          {t("workspace.undo")}
        </Button>
      </li>
    );
  }

  const set = (patch: Partial<DraftRow>) => props.onUpdate(row.id, patch);
  const timeError = errorText(errors.startMs ?? errors.endMs);

  return (
    <li
      id={`sentence-${row.id}`}
      className={`flex scroll-mt-24 flex-col gap-2 rounded-xl border bg-surface p-3 transition-[border-color,box-shadow] ${
        hasError ? "border-danger" : active || editing ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={playing ? "primary" : "secondary"}
          iconOnly
          disabled={!canPlay}
          aria-label={playing ? t("detail.stop") : t("detail.listen")}
          title={playing ? t("detail.stop") : t("detail.listen")}
          onClick={() => props.onPlay(row, playing)}
        >
          <Icon name={playing ? "pause" : "play"} />
        </Button>
        {editable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => props.onToggleSelect(row.id)}
            aria-label={t("workspace.select", { n: index + 1 })}
            title={t("workspace.select", { n: index + 1 })}
            className="size-4 cursor-pointer accent-[var(--primary)]"
          />
        )}
        <span className="rounded-md bg-bg-elevated px-1.5 py-0.5 text-xs font-semibold text-text-muted">#{index + 1}</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 font-mono text-sm font-semibold text-primary-text">
          <Icon name="clock" className="size-3.5" />
          {row.start || "--:--.-"} – {row.end || "--:--.-"}
        </span>
        {changed && (
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-text">
            {row.isNew ? t("workspace.new") : t("workspace.edited")}
          </span>
        )}
        {editable && (
          <div className="ml-auto flex items-center gap-1">
            {props.canMerge && (
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                aria-label={t("workspace.merge")}
                title={t("workspace.merge")}
                onClick={() => props.onMerge(row.id)}
              >
                <Icon name="merge" />
              </Button>
            )}
            <Button
              size="sm"
              variant={editing ? "primary" : "ghost"}
              leftIcon={<Icon name={editing ? "check" : "pencil-line"} />}
              onClick={() => props.onToggleEdit(row.id)}
            >
              {editing ? t("workspace.done") : t("workspace.edit")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              className="text-danger"
              aria-label={t("sentences.delete")}
              title={t("sentences.delete")}
              onClick={() => set({ deleted: true })}
            >
              <Icon name="trash-2" />
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2.5">
          <Field label={t("sentences.textEn")} error={errorText(errors.textEn)}>
            <textarea
              rows={3}
              value={row.textEn}
              maxLength={600}
              onChange={(e) => set({ textEn: e.target.value })}
              className={inputClass(errors.textEn)}
            />
          </Field>
          {props.canSplit && (
            <SplitPicker
              text={row.textEn}
              open={splitting}
              onToggle={() => setSplitting((v) => !v)}
              onSplit={(offset) => {
                setSplitting(false);
                props.onSplit(row.id, offset);
              }}
            />
          )}
          <Field label={t("sentences.textVi")} error={errorText(errors.textVi)}>
            <textarea
              rows={3}
              value={row.textVi}
              maxLength={600}
              onChange={(e) => set({ textVi: e.target.value })}
              className={inputClass(errors.textVi)}
            />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-text-muted">{t("workspace.timing")}</span>
            <div className="flex flex-wrap items-center gap-2">
              <TimeControl
                label={t("sentences.start")}
                value={row.start}
                error={errors.startMs}
                onChange={(start) => set({ start })}
              />
              <span className="text-text-muted">–</span>
              <TimeControl
                label={t("sentences.end")}
                value={row.end}
                error={errors.endMs}
                onChange={(end) => set({ end })}
              />
            </div>
            {timeError ? (
              <span className="text-xs text-danger">{timeError}</span>
            ) : (
              <span className="text-xs text-text-subtle">{t("workspace.timingHint")}</span>
            )}
          </div>
        </div>
      ) : (
        // Bấm vào nội dung để phát câu này.
        <button
          type="button"
          disabled={!canPlay}
          onClick={() => props.onPlay(row, false)}
          className="flex cursor-pointer flex-col gap-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-default"
        >
          <span className="text-[15px] font-medium leading-snug text-text">{row.textEn}</span>
          <span className={`text-sm ${row.textVi ? "text-text-muted" : "italic text-warning"}`}>
            {row.textVi || t("detail.noTranslation")}
          </span>
          {hasError && <span className="text-xs text-danger">{t("workspace.hasErrors")}</span>}
        </button>
      )}
    </li>
  );
}

export default memo(SentenceCard);

// field-sizing-content: ô cao theo nội dung để câu dài không bị cuộn trong ô hẹp; trình duyệt chưa hỗ trợ thì dùng rows.
const inputClass = (error?: string) =>
  `w-full resize-y rounded-md border bg-bg px-2.5 py-1.5 text-sm leading-relaxed text-text field-sizing-content min-h-16 max-h-80 ${
    error ? "border-danger" : "border-border"
  }`;

/**
 * Tách câu bằng cách bấm vào vạch giữa hai từ (BR-BH-13), nên không cắt được giữa một từ. Vạch thứ i nằm trước từ i,
 * vị trí cắt là chỉ số ký tự đầu của từ đó trong câu tiếng Anh.
 */
function SplitPicker({
  text,
  open,
  onToggle,
  onSplit,
}: Readonly<{ text: string; open: boolean; onToggle: () => void; onSplit: (offset: number) => void }>) {
  const { t } = useTranslation("lessonManage");
  const words = [...text.matchAll(/\S+/g)];
  return (
    <div className="-mt-1 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={open ? "primary" : "secondary"}
          leftIcon={<Icon name="scissors" />}
          disabled={words.length < 2}
          onClick={onToggle}
        >
          {open ? t("workspace.splitCancel") : t("workspace.split")}
        </Button>
        {open && <span className="text-xs text-text-subtle">{t("workspace.splitHint")}</span>}
      </div>
      {open && (
        <p className="rounded-md border border-dashed border-primary bg-bg px-2.5 py-2 text-sm leading-8 text-text">
          {words.map((w, i) => (
            <span key={w.index}>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => onSplit(w.index)}
                  aria-label={t("workspace.splitHere", { before: words[i - 1][0], after: w[0] })}
                  title={t("workspace.splitHere", { before: words[i - 1][0], after: w[0] })}
                  className="group mx-0.5 inline-flex h-6 w-3 cursor-pointer items-center justify-center align-middle focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="h-5 w-0.5 rounded-full bg-border transition-all group-hover:w-1 group-hover:bg-primary group-focus-visible:bg-primary" />
                </button>
              )}
              {w[0]}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function Field({ label, error, children }: Readonly<{ label: string; error?: string; children: React.ReactNode }>) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
      {label}
      {children}
      {error && <span className="font-normal text-danger">{error}</span>}
    </label>
  );
}

function TimeControl({
  label,
  value,
  error,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}>) {
  const { t } = useTranslation("lessonManage");
  return (
    <div className="flex items-center gap-1">
      <input
        aria-label={label}
        title={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("workspace.splitTime")}
        aria-invalid={error ? true : undefined}
        className={`h-9 w-24 rounded-md border bg-bg px-2 text-center font-mono text-sm text-text placeholder:text-[11px] placeholder:text-danger ${
          error || value.trim() === "" ? "border-danger" : "border-border"
        }`}
      />
      <Button size="sm" variant="ghost" iconOnly aria-label={t("workspace.minus", { label })} title={t("workspace.minus", { label })} onClick={() => onChange(shiftTime(value, -NUDGE_MS))}>
        <Icon name="minus" />
      </Button>
      <Button size="sm" variant="ghost" iconOnly aria-label={t("workspace.plus", { label })} title={t("workspace.plus", { label })} onClick={() => onChange(shiftTime(value, NUDGE_MS))}>
        <Icon name="plus" />
      </Button>
    </div>
  );
}
