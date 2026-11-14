// Kiểm và phân loại lỗi của biểu mẫu nhóm thẻ, thẻ và nhập tệp (UC-NT-01 đến 07, BR-NT-02, 03, 07, 08). Máy chủ kiểm
// lại mọi quy tắc; phần này để báo lỗi ngay cạnh ô nhập và chọn thông báo phù hợp.
import { validateDeckImage } from "./createDeckForm";
import type { DeckApiError } from "./deckManageTypes";
import {
  isCardPos,
  type AttachImageItem,
  type AttachImagesResult,
  type CardInput,
  type ImportRowError,
} from "./deckContentTypes";

export const GROUP_NAME_MAX = 100;
export const WORD_MAX = 100;
export const IPA_MAX = 100;
export const TEXT_MAX = 500;
export const IMPORT_MAX_BYTES = 2_097_152;
const IMPORT_EXTENSIONS = [".xlsx", ".csv"];

/** Độ dài tính theo ký tự Unicode như máy chủ, không theo đơn vị UTF-16. */
const lengthOf = (text: string) => [...text].length;

// ------------------------------------------------------------------ nhóm thẻ

export type GroupNameError = "NotBlank" | "Size" | "Duplicate";

/** Tên nhóm bắt buộc, 1 đến 100 ký tự sau khi cắt khoảng trắng hai đầu (BR-NT-02). */
export function validateGroupName(name: string): GroupNameError | null {
  const trimmed = name.trim();
  if (trimmed === "") return "NotBlank";
  if (lengthOf(trimmed) > GROUP_NAME_MAX) return "Size";
  return null;
}

// ------------------------------------------------------------------ thẻ

/** Giá trị biểu mẫu thẻ; mọi ô là chuỗi, ô trống là "". */
export interface CardFormValues {
  word: string;
  meaningVi: string;
  ipaUk: string;
  ipaUs: string;
  pos: string;
  definitionEn: string;
  definitionVi: string;
  exampleEn: string;
  exampleVi: string;
}

export type CardField = keyof CardFormValues;
export type CardErrors = Partial<Record<CardField, string>>;

export const EMPTY_CARD: CardFormValues = {
  word: "",
  meaningVi: "",
  ipaUk: "",
  ipaUs: "",
  pos: "",
  definitionEn: "",
  definitionVi: "",
  exampleEn: "",
  exampleVi: "",
};

const MAX_BY_FIELD: Record<CardField, number> = {
  word: WORD_MAX,
  meaningVi: TEXT_MAX,
  ipaUk: IPA_MAX,
  ipaUs: IPA_MAX,
  pos: TEXT_MAX,
  definitionEn: TEXT_MAX,
  definitionVi: TEXT_MAX,
  exampleEn: TEXT_MAX,
  exampleVi: TEXT_MAX,
};

export function cardValuesOf(card: {
  word: string;
  meaningVi: string;
  ipaUk: string | null;
  ipaUs: string | null;
  pos: string | null;
  definitionEn: string | null;
  definitionVi: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
}): CardFormValues {
  return {
    word: card.word,
    meaningVi: card.meaningVi,
    ipaUk: card.ipaUk ?? "",
    ipaUs: card.ipaUs ?? "",
    pos: card.pos ?? "",
    definitionEn: card.definitionEn ?? "",
    definitionVi: card.definitionVi ?? "",
    exampleEn: card.exampleEn ?? "",
    exampleVi: card.exampleVi ?? "",
  };
}

/** Từ vựng và nghĩa tiếng Việt bắt buộc; giới hạn độ dài và loại từ theo BR-NT-03. Mã lỗi giống mã máy chủ. */
export function validateCard(values: CardFormValues): CardErrors {
  const errors: CardErrors = {};
  for (const field of Object.keys(MAX_BY_FIELD) as CardField[]) {
    const value = values[field].trim();
    if ((field === "word" || field === "meaningVi") && value === "") errors[field] = "NotBlank";
    else if (lengthOf(value) > MAX_BY_FIELD[field]) errors[field] = "Size";
  }
  if (values.pos !== "" && !isCardPos(values.pos)) errors.pos = "Pattern";
  return errors;
}

const optional = (text: string) => (text.trim() === "" ? null : text.trim());

export function toCardInput(values: CardFormValues): CardInput {
  return {
    word: values.word.trim(),
    meaningVi: values.meaningVi.trim(),
    ipaUk: optional(values.ipaUk),
    ipaUs: optional(values.ipaUs),
    pos: isCardPos(values.pos) ? values.pos : null,
    definitionEn: optional(values.definitionEn),
    definitionVi: optional(values.definitionVi),
    exampleEn: optional(values.exampleEn),
    exampleVi: optional(values.exampleVi),
  };
}

/** Biểu mẫu có ô nào đã nhập chưa (để biết điền sẵn từ từ điển có ghi đè dữ liệu không). */
export function hasCardContent(values: CardFormValues): boolean {
  return Object.values(values).some((v) => v.trim() !== "");
}

/** Một nghĩa trong từ điển để điền sẵn vào thẻ (BR-NT-08). */
export interface DictionaryChoice {
  headword: string;
  pos: string | null;
  ipaUk: string | null;
  ipaUs: string | null;
  translationVi: string | null;
  definitionEn: string | null;
  definitionVi: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
}

/**
 * Giá trị biểu mẫu từ một nghĩa trong từ điển: thay mọi ô của thẻ (BR-NT-08). Loại từ ngoài danh sách của thẻ (vd viết
 * tắt, tiền tố) để trống cho giáo viên tự chọn (AC-NT-60).
 */
export function cardValuesFromDictionary(choice: DictionaryChoice): CardFormValues {
  return {
    word: choice.headword,
    meaningVi: choice.translationVi ?? "",
    ipaUk: choice.ipaUk ?? "",
    ipaUs: choice.ipaUs ?? "",
    pos: isCardPos(choice.pos) ? choice.pos : "",
    definitionEn: choice.definitionEn ?? "",
    definitionVi: choice.definitionVi ?? "",
    exampleEn: choice.exampleEn ?? "",
    exampleVi: choice.exampleVi ?? "",
  };
}

// ------------------------------------------------------------------ gắn ảnh hàng loạt (UC-NT-08, BR-NT-09)

/** Số ảnh gửi mỗi lần gắn (giới hạn của máy chủ) và số ảnh tải lên S3 song song. */
export const ATTACH_BATCH = 100;
export const UPLOAD_CONCURRENCY = 4;

/**
 * Kết quả gắn ảnh theo tên tệp: `attached` đã gắn; `unmatched` không khớp từ vựng nào của nhóm; `duplicated` trùng thẻ
 * với ảnh khác; `invalid` không phải JPG/PNG hoặc quá 2 MB; `failed` tải lên không được (mất kết nối).
 */
export interface BulkImageSummary {
  attached: AttachImagesResult["attached"];
  unmatched: string[];
  duplicated: string[];
  invalid: string[];
  failed: string[];
}

export interface BulkImageFile {
  name: string;
  size: number;
  type: string;
}

/**
 * Kiểm sơ bộ ảnh ở trình duyệt, tải ảnh hợp lệ lên S3 (tối đa `UPLOAD_CONCURRENCY` ảnh cùng lúc), rồi gửi gắn theo từng
 * đợt `ATTACH_BATCH` ảnh và gộp kết quả. Lỗi khi gửi gắn (bộ, nhóm không còn, mất kết nối) được ném ra để hộp thoại xử
 * lý; các đợt đã gắn trước đó vẫn giữ.
 */
export async function attachImagesInBatches<F extends BulkImageFile>(
  files: F[],
  upload: (file: F) => Promise<string>,
  attach: (items: AttachImageItem[]) => Promise<AttachImagesResult>,
  onProgress?: (done: number, total: number) => void,
): Promise<BulkImageSummary> {
  const summary: BulkImageSummary = { attached: [], unmatched: [], duplicated: [], invalid: [], failed: [] };
  const valid = files.filter((file) => {
    if (validateDeckImage(file) === null) return true;
    summary.invalid.push(file.name);
    return false;
  });

  const uploaded: AttachImageItem[] = [];
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < valid.length) {
      const file = valid[next++];
      try {
        uploaded.push({ fileName: file.name, imageKey: await upload(file) });
      } catch {
        summary.failed.push(file.name);
      }
      onProgress?.(++done, valid.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, valid.length) }, worker));

  // Gửi theo thứ tự người dùng chọn để ảnh trùng thẻ được xử lý ổn định (ảnh chọn trước được gắn).
  const order = new Map(files.map((file, index) => [file.name, index]));
  uploaded.sort((a, b) => (order.get(a.fileName) ?? 0) - (order.get(b.fileName) ?? 0));
  for (let i = 0; i < uploaded.length; i += ATTACH_BATCH) {
    const result = await attach(uploaded.slice(i, i + ATTACH_BATCH));
    summary.attached.push(...result.attached);
    summary.unmatched.push(...result.unmatched);
    summary.duplicated.push(...result.duplicated);
    summary.invalid.push(...result.invalid);
  }
  return summary;
}

// ------------------------------------------------------------------ phân loại lỗi máy chủ

/**
 * Cách giao diện xử lý một lỗi khi lưu hoặc xóa:
 * - `deckGone`: bộ đã bị xóa, về danh sách bộ (luồng 1b);
 * - `groupGone`, `cardGone`: nhóm hoặc thẻ không còn, đóng hộp và tải lại (luồng 2a, 3a, 4a);
 * - `forbidden`: bộ của giáo viên khác (luồng 1a);
 * - `mustStayPublishable`: bộ Đã xuất bản sẽ không còn đủ điều kiện (BR-NT-05);
 * - `fields`: lỗi cạnh từng ô; `wordTaken` kèm thẻ đang dùng từ đó (BR-BT-04);
 * - `retry`: mất kết nối hoặc lỗi máy chủ, giữ nguyên biểu mẫu để lưu lại (luồng 8a, 9a).
 */
export type ContentFailure =
  | { kind: "deckGone" }
  | { kind: "groupGone" }
  | { kind: "cardGone" }
  | { kind: "forbidden" }
  | { kind: "mustStayPublishable"; reason: "EMPTY_GROUP" | "LAST_GROUP" | "LAST_CARD" }
  | { kind: "fields"; errors: Record<string, string>; wordTaken?: { word: string; groupName: string } }
  | { kind: "retry" };

export function contentFailure(error: DeckApiError): ContentFailure {
  switch (error.code) {
    case "VOCAB_DECK_NOT_FOUND":
      return { kind: "deckGone" };
    case "VOCAB_GROUP_NOT_FOUND":
      return { kind: "groupGone" };
    case "VOCAB_CARD_NOT_FOUND":
      return { kind: "cardGone" };
    case "VOCAB_GROUP_NAME_TAKEN":
      return { kind: "fields", errors: { name: "Duplicate" } };
    case "VOCAB_CARD_WORD_TAKEN": {
      const details = error.details ?? {};
      return {
        kind: "fields",
        errors: { word: "Duplicate" },
        wordTaken: { word: String(details.word ?? ""), groupName: String(details.groupName ?? "") },
      };
    }
    case "VOCAB_DECK_MUST_STAY_PUBLISHABLE": {
      const reason = error.details?.reason;
      return {
        kind: "mustStayPublishable",
        reason: reason === "LAST_GROUP" || reason === "LAST_CARD" ? reason : "EMPTY_GROUP",
      };
    }
    default:
  }
  if (error.kind === "forbidden") return { kind: "forbidden" };
  if (error.kind === "validation" && error.fieldErrors.length > 0) {
    const errors: Record<string, string> = {};
    for (const { field, code } of error.fieldErrors) errors[field] ??= code;
    return { kind: "fields", errors };
  }
  return { kind: "retry" };
}

// ------------------------------------------------------------------ nhập từ tệp (UC-NT-07)

export type ImportFileError = "FORMAT" | "TOO_LARGE" | "MISSING_COLUMNS" | "EMPTY";

/** Kiểm sơ bộ ở trình duyệt theo đuôi tệp và dung lượng (BR-NT-07); nội dung do máy chủ kiểm. */
export function validateImportFile(file: Pick<File, "name" | "size">): ImportFileError | null {
  const name = file.name.toLowerCase();
  if (!IMPORT_EXTENSIONS.some((ext) => name.endsWith(ext))) return "FORMAT";
  if (file.size > IMPORT_MAX_BYTES) return "TOO_LARGE";
  if (file.size === 0) return "EMPTY";
  return null;
}

/**
 * Kết quả kiểm hoặc nhập tệp: lỗi tệp (`file`, kèm cột thiếu), quá 500 dòng (`tooManyRows`), các dòng sai (`rows`)
 * hoặc lỗi chung của thao tác (`content`: không còn bộ, nhóm, mất kết nối...).
 */
export type ImportFailure =
  | { kind: "file"; reason: ImportFileError; missingColumns: string[] }
  | { kind: "tooManyRows"; max: number }
  | { kind: "rows"; errors: ImportRowError[] }
  | { kind: "content"; failure: ContentFailure };

export function importFailure(error: DeckApiError): ImportFailure {
  const details = error.details ?? {};
  if (error.code === "VOCAB_IMPORT_FILE_INVALID") {
    const reason = details.reason;
    return {
      kind: "file",
      reason: reason === "TOO_LARGE" || reason === "MISSING_COLUMNS" || reason === "EMPTY" ? reason : "FORMAT",
      missingColumns: Array.isArray(details.missingColumns) ? details.missingColumns.map(String) : [],
    };
  }
  if (error.code === "VOCAB_IMPORT_TOO_MANY_ROWS") {
    return { kind: "tooManyRows", max: typeof details.max === "number" ? details.max : 500 };
  }
  if (error.code === "VOCAB_IMPORT_ROWS_INVALID") {
    return { kind: "rows", errors: Array.isArray(details.errors) ? (details.errors as ImportRowError[]) : [] };
  }
  if (error.status === 413) return { kind: "file", reason: "TOO_LARGE", missingColumns: [] };
  return { kind: "content", failure: contentFailure(error) };
}

/** Phiên âm có thể đã kèm dấu `/` (nhập tay, từ điển); bỏ đi để luôn hiện đúng một cặp `/…/`. */
export function formatIpa(ipa: string): string {
  return `/${ipa.trim().replace(/^\/+|\/+$/g, "")}/`;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** Tách câu ví dụ thành các đoạn, đánh dấu đoạn trùng từ vựng (không phân biệt hoa thường) để tô đậm. */
export function splitByWord(sentence: string, word: string): { text: string; match: boolean }[] {
  const target = word.trim();
  if (!target) return [{ text: sentence, match: false }];
  return sentence
    .split(new RegExp(`(${escapeRegExp(target)})`, "gi"))
    .map((text, i) => ({ text, match: i % 2 === 1 }))
    .filter((part) => part.text !== "");
}
