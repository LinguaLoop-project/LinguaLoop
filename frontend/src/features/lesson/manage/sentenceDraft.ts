import { formatMs, parseMs } from "./time";
import type {
  LessonSentence,
  NewSentence,
  SentenceEdit,
  SentenceFieldError,
} from "./types";

/** Một câu đang sửa trên màn Sửa câu (UC-BH-05); mốc thời gian giữ dạng chữ để giáo viên gõ tự do. */
export interface DraftRow {
  id: string;
  textEn: string;
  ipaUs: string;
  ipaUk: string;
  textVi: string;
  start: string;
  end: string;
  deleted: boolean;
  /** Câu sinh ra khi tách câu, chưa lưu; `id` là khóa tạm trình duyệt đặt. */
  isNew?: boolean;
}

export type DraftField =
  "textEn" | "ipaUs" | "ipaUk" | "textVi" | "startMs" | "endMs";

/** Lỗi theo câu và ô; mã lỗi khớp backend (`NotBlank`, `Size`, `Overlap`, ...). */
export type DraftErrors = Record<string, Partial<Record<DraftField, string>>>;

const TEXT_MAX = 500;
const MIN_SENTENCE_MS = 500;

export function toDraft(sentences: LessonSentence[]): DraftRow[] {
  return sentences.map((s) => ({
    id: s.id,
    textEn: s.textEn,
    ipaUs: s.ipaUs ?? "",
    ipaUk: s.ipaUk ?? "",
    textVi: s.textVi ?? "",
    start: formatMs(s.startMs),
    end: formatMs(s.endMs),
    deleted: false,
  }));
}

const orNull = (text: string) => (text.trim() === "" ? null : text.trim());

/**
 * Mốc của ô: ô vẫn hiện đúng chữ của mốc gốc thì trả mốc gốc. Ô chỉ hiện tới 0,1 giây còn mốc gốc có thể lẻ mili giây
 * (vd 412), nên so thẳng sẽ coi mọi câu là đã sửa ngay khi mở trang, và lưu sẽ làm tròn mốc giáo viên không đụng tới.
 */
function timeOf(text: string, originalMs: number | undefined): number | null {
  if (originalMs !== undefined && text.trim() === formatMs(originalMs)) return originalMs;
  return parseMs(text);
}

function changed(row: DraftRow, original: LessonSentence): boolean {
  return (
    row.textEn.trim() !== original.textEn ||
    orNull(row.ipaUs) !== original.ipaUs ||
    orNull(row.ipaUk) !== original.ipaUk ||
    orNull(row.textVi) !== original.textVi ||
    timeOf(row.start, original.startMs) !== original.startMs ||
    timeOf(row.end, original.endMs) !== original.endMs
  );
}

/** Còn thay đổi chưa lưu (UC-BH-05 3c). */
export function isDirty(
  rows: DraftRow[],
  originals: LessonSentence[],
): boolean {
  const byId = new Map(originals.map((s) => [s.id, s]));
  return rows.some((row) => {
    const original = byId.get(row.id);
    return !original || row.deleted || changed(row, original);
  });
}

/** Số câu sẽ thay đổi khi lưu: câu đã sửa cộng câu đã chọn xóa. */
export function changeCount(
  rows: DraftRow[],
  originals: LessonSentence[],
): number {
  const byId = new Map(originals.map((s) => [s.id, s]));
  return rows.filter((row) => {
    const original = byId.get(row.id);
    return !original || row.deleted || changed(row, original);
  }).length;
}

/** Câu này khác bản đã lưu (để đánh dấu "đã sửa" trên thẻ câu). */
export function isRowChanged(
  row: DraftRow,
  original: LessonSentence | undefined,
): boolean {
  return !original || row.deleted || changed(row, original);
}

/** Dời mốc thời gian dạng chữ đi `deltaMs`, không âm; mốc không đọc được thì giữ nguyên. */
export function shiftTime(text: string, deltaMs: number): string {
  const ms = parseMs(text);
  return ms === null ? text : formatMs(Math.max(0, ms + deltaMs));
}

/**
 * Kiểm trước khi gửi theo BR-BH-09: câu tiếng Anh 1 đến 500 ký tự, IPA và bản dịch tối đa 500, mốc đọc được, bắt đầu
 * nhỏ hơn kết thúc, đoạn ít nhất 0,5 giây, không vượt độ dài video, không chồng lấn câu kề bên. Server kiểm lại.
 */
export function validateDraft(rows: DraftRow[], videoMs: number): DraftErrors {
  const errors: DraftErrors = {};
  const add = (id: string, field: DraftField, code: string) => {
    errors[id] = { ...errors[id], [field]: errors[id]?.[field] ?? code };
  };
  const alive = rows.filter((r) => !r.deleted);
  const timed: { id: string; start: number; end: number }[] = [];
  for (const row of alive) {
    const text = row.textEn.trim();
    if (text === "") add(row.id, "textEn", "NotBlank");
    else if ([...text].length > TEXT_MAX) add(row.id, "textEn", "Size");
    if ([...row.ipaUs.trim()].length > TEXT_MAX) add(row.id, "ipaUs", "Size");
    if ([...row.ipaUk.trim()].length > TEXT_MAX) add(row.id, "ipaUk", "Size");
    if ([...row.textVi.trim()].length > TEXT_MAX) add(row.id, "textVi", "Size");
    const start = parseMs(row.start);
    const end = parseMs(row.end);
    if (start === null)
      add(row.id, "startMs", row.start.trim() === "" ? "Required" : "Format");
    if (end === null)
      add(row.id, "endMs", row.end.trim() === "" ? "Required" : "Format");
    if (start === null || end === null) continue;
    if (start >= end) add(row.id, "endMs", "StartBeforeEnd");
    else if (end - start < MIN_SENTENCE_MS) add(row.id, "endMs", "MinDuration");
    if (end > videoMs) add(row.id, "endMs", "ExceedsVideo");
    timed.push({ id: row.id, start, end });
  }
  timed.sort((a, b) => a.start - b.start);
  for (let i = 1; i < timed.length; i++) {
    if (timed[i].start < timed[i - 1].end) {
      add(timed[i - 1].id, "endMs", "Overlap");
      add(timed[i].id, "startMs", "Overlap");
    }
  }
  return errors;
}

/** Lỗi server (`details.errors[]`) về cùng dạng với lỗi kiểm ở trình duyệt. */
export function serverErrors(list: SentenceFieldError[]): DraftErrors {
  const errors: DraftErrors = {};
  for (const { sentenceId, field, code } of list) {
    errors[sentenceId] = { ...errors[sentenceId], [field as DraftField]: code };
  }
  return errors;
}

/**
 * Các câu đã đổi và các câu đã chọn "Xóa", để gửi trong một lần "Lưu". Gọi sau khi `validateDraft` không có lỗi.
 * Giáo viên không sửa IPA trên màn này: câu mới hoặc câu đổi chữ tiếng Anh gửi IPA trống để server tạo lại theo bảng
 * phonemes mà shadowing đọc được (BR-BH-13); câu không đổi chữ giữ IPA cũ.
 */
export function collectChanges(
  rows: DraftRow[],
  originals: LessonSentence[],
): { sentences: SentenceEdit[]; deletedIds: string[]; added: NewSentence[] } {
  const byId = new Map(originals.map((s) => [s.id, s]));
  const deletedIds = rows.filter((r) => r.deleted && !r.isNew).map((r) => r.id);
  const added = rows
    .filter((r) => r.isNew && !r.deleted)
    .map((r) => ({
      key: r.id,
      textEn: r.textEn.trim(),
      ipaUs: orNull(r.ipaUs),
      ipaUk: orNull(r.ipaUk),
      textVi: orNull(r.textVi),
      startMs: parseMs(r.start) ?? 0,
      endMs: parseMs(r.end) ?? 0,
    }));
  const sentences = rows
    .filter((r) => !r.deleted)
    .filter((r) => {
      const original = byId.get(r.id);
      return original !== undefined && changed(r, original);
    })
    .map((r) => {
      const textChanged = r.textEn.trim() !== byId.get(r.id)?.textEn;
      return {
        id: r.id,
        textEn: r.textEn.trim(),
        ipaUs: textChanged ? null : orNull(r.ipaUs),
        ipaUk: textChanged ? null : orNull(r.ipaUk),
        textVi: orNull(r.textVi),
        startMs: timeOf(r.start, byId.get(r.id)?.startMs) ?? 0,
        endMs: timeOf(r.end, byId.get(r.id)?.endMs) ?? 0,
      };
    });
  return { sentences, deletedIds, added };
}

export type SuggestScope = "selected" | "all";
export type SuggestMode = "empty" | "overwrite";

/**
 * Các câu cần gửi đi sinh gợi ý bản dịch (UC-BH-10 Bước 3): theo phạm vi, bỏ câu đã chọn xóa; "chỉ điền ô còn trống"
 * thì chỉ lấy câu chưa có bản dịch.
 */
export function suggestTargets(
  rows: DraftRow[],
  selected: Set<string>,
  scope: SuggestScope,
  mode: SuggestMode,
): DraftRow[] {
  return (
    rows
      // câu mới tách chưa lưu thì server chưa biết, lưu rồi mới gợi ý được
      .filter((r) => !r.deleted && !r.isNew && r.textEn.trim() !== "")
      .filter((r) => scope === "all" || selected.has(r.id))
      .filter((r) => mode === "overwrite" || r.textVi.trim() === "")
  );
}

/**
 * Tách câu `id` tại vị trí `cursor` trong câu tiếng Anh (BR-BH-13, chỉ bài chưa từng xuất bản). Phần trước giữ ở câu cũ,
 * phần sau thành câu mới ngay sau. Mốc tách để trống cho giáo viên tự nhập; bản dịch giữ ở câu đầu để giáo viên tự cắt;
 * IPA của cả hai để trống để server tạo lại khi lưu. Một phía trống thì không tách, trả `null`.
 */
export function splitRow(
  rows: DraftRow[],
  id: string,
  cursor: number,
  newId: string,
): DraftRow[] | null {
  const index = rows.findIndex((r) => r.id === id);
  const row = rows[index];
  if (!row) return null;
  const before = row.textEn.slice(0, cursor).trim();
  const after = row.textEn.slice(cursor).trim();
  if (before === "" || after === "") return null;
  const first: DraftRow = {
    ...row,
    textEn: before,
    ipaUs: "",
    ipaUk: "",
    end: "",
  };
  const second: DraftRow = {
    id: newId,
    textEn: after,
    ipaUs: "",
    ipaUk: "",
    textVi: "",
    start: "",
    end: row.end,
    deleted: false,
    isNew: true,
  };
  return [...rows.slice(0, index), first, second, ...rows.slice(index + 1)];
}

/** Câu còn lại ngay sau câu `id` (bỏ qua câu đã chọn xóa), để gộp. */
export function nextAlive(rows: DraftRow[], id: string): DraftRow | null {
  const index = rows.findIndex((r) => r.id === id);
  return rows.slice(index + 1).find((r) => !r.deleted) ?? null;
}

/**
 * Gộp câu `id` với câu ngay sau: nối chữ và bản dịch, lấy mốc bắt đầu của câu trước và mốc kết thúc của câu sau, xóa
 * IPA để server tạo lại; câu sau bị xóa (câu mới chưa lưu thì bỏ hẳn). Không có câu sau thì trả `null`.
 */
export function mergeWithNext(rows: DraftRow[], id: string): DraftRow[] | null {
  const row = rows.find((r) => r.id === id);
  const next = nextAlive(rows, id);
  if (!row || !next) return null;
  const join = (a: string, b: string) =>
    [a.trim(), b.trim()].filter(Boolean).join(" ");
  const merged: DraftRow = {
    ...row,
    textEn: join(row.textEn, next.textEn),
    textVi: join(row.textVi, next.textVi),
    ipaUs: "",
    ipaUk: "",
    end: next.end,
  };
  return rows
    .filter((r) => !(r.id === next.id && r.isNew))
    .map((r) =>
      r.id === row.id ? merged : r.id === next.id ? { ...r, deleted: true } : r,
    );
}
