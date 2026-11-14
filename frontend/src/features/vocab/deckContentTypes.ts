// Kiểu dữ liệu của phần nhóm thẻ và thẻ trong bộ của giáo viên (UC-NT-01 đến UC-NT-07).

/** Mã loại từ của thẻ (BR-NT-03), khớp CHECK của `vocab_cards.pos` và `CardPos` ở backend. */
export const CARD_POS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "determiner",
  "interjection",
  "phrasal verb",
  "idiom",
  "phrase",
  "collocation",
  "modal verb",
] as const;

export type CardPos = (typeof CARD_POS)[number];

export function isCardPos(value: string | null | undefined): value is CardPos {
  return value != null && (CARD_POS as readonly string[]).includes(value);
}

/** Nội dung thẻ gửi lên (`CardRequest`); mục tùy chọn trống là `null`. */
export interface CardInput {
  word: string;
  meaningVi: string;
  ipaUk: string | null;
  ipaUs: string | null;
  pos: CardPos | null;
  definitionEn: string | null;
  definitionVi: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
}

/** Tóm tắt trước khi nhập (UC-NT-07 bước 7). */
export interface ImportPreview {
  cardCount: number;
}

export interface ImportResult {
  addedCount: number;
}

/**
 * Một lỗi của dòng trong tệp nhập (`details.errors[]` của `VOCAB_IMPORT_ROWS_INVALID`). `row` là số dòng khi mở tệp
 * bằng Excel (dòng tên cột là dòng 1); `code` là tên ràng buộc (`NotBlank`, `Size`, `Pattern`) hoặc
 * `DuplicateInDeck`, `DuplicateInFile` (kèm `otherRow`).
 */
export interface ImportRowError {
  row: number;
  field: string;
  code: string;
  otherRow?: number;
}

export type TemplateFormat = "xlsx" | "csv";

/** Một ảnh đã tải lên S3 để gắn hàng loạt: tên tệp gốc (để ghép với từ vựng) và S3 key (UC-NT-08). */
export interface AttachImageItem {
  fileName: string;
  imageKey: string;
}

/** Kết quả gắn ảnh hàng loạt (`CardImagesView.Result`). */
export interface AttachImagesResult {
  attached: { cardId: string; word: string; fileName: string }[];
  unmatched: string[];
  duplicated: string[];
  invalid: string[];
}
