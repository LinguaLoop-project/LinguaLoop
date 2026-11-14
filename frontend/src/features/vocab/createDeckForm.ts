// Kiểm và gửi biểu mẫu tạo bộ thẻ (UC-BT-02, BR-BT-03, 13). Máy chủ kiểm lại tên và chữ ký ảnh.
import type { CreateDeckInput, DeckApiError, TeacherDeckItem } from "./deckManageTypes";

export const DECK_NAME_MAX = 100;
export const DECK_IMAGE_MAX_BYTES = 2_097_152;
const IMAGE_TYPES = ["image/jpeg", "image/png"];

/** Mã lỗi, khớp mã server trả trong `errors[].code`. */
export type NameError = "NotBlank" | "Size" | "Duplicate";
export type ImageError = "ImageType" | "MaxBytes";

export interface CreateDeckValues {
  name: string;
  categoryId: string | null;
  pro: boolean;
  image: File | null;
}

export interface CreateDeckErrors {
  name?: NameError;
  image?: ImageError;
  categoryId?: string;
  /** Lỗi không gắn ô nào: mất kết nối, lỗi máy chủ (AC-BT-13). */
  form?: "failed";
}

export const EMPTY_CREATE_DECK: CreateDeckValues = { name: "", categoryId: null, pro: false, image: null };

/** Tên bắt buộc, 1 đến 100 ký tự sau khi cắt khoảng trắng hai đầu. */
export function validateDeckName(name: string): NameError | null {
  const trimmed = name.trim();
  if (trimmed === "") return "NotBlank";
  if ([...trimmed].length > DECK_NAME_MAX) return "Size";
  return null;
}

/** Kiểm sơ bộ ở trình duyệt theo loại tệp và dung lượng; tệp đổi đuôi do máy chủ chặn theo nội dung. */
export function validateDeckImage(image: Pick<File, "size" | "type"> | null): ImageError | null {
  if (!image) return null;
  if (!IMAGE_TYPES.includes(image.type)) return "ImageType";
  if (image.size > DECK_IMAGE_MAX_BYTES) return "MaxBytes";
  return null;
}

export function validateCreateDeck(values: CreateDeckValues): CreateDeckErrors {
  const errors: CreateDeckErrors = {};
  const name = validateDeckName(values.name);
  if (name) errors.name = name;
  const image = validateDeckImage(values.image);
  if (image) errors.image = image;
  return errors;
}

export function toCreateDeckInput(values: CreateDeckValues): CreateDeckInput {
  return { name: values.name.trim(), categoryId: values.categoryId, pro: values.pro };
}

/** Lỗi từ server gắn về đúng ô; trùng tên (409) gắn vào ô tên; lỗi khác là "tạo không thành công". */
export function errorsFromApi(error: DeckApiError): CreateDeckErrors {
  if (error.kind === "conflict") return { name: "Duplicate" };
  if (error.kind === "validation" && error.fieldErrors.length > 0) {
    const errors: CreateDeckErrors = {};
    for (const { field, code } of error.fieldErrors) {
      if (field === "name") errors.name = code === "Size" ? "Size" : "NotBlank";
      else if (field === "image") errors.image = code === "MaxBytes" ? "MaxBytes" : "ImageType";
      // lỗi của bước xin URL tải ảnh (POST /uploads/presign) cũng gắn vào ô ảnh
      else if (field === "contentType") errors.image = "ImageType";
      else if (field === "size") errors.image = "MaxBytes";
      else if (field === "categoryId") errors.categoryId = code;
    }
    return errors;
  }
  return { form: "failed" };
}

export type SubmitResult =
  | { ok: true; deck: TeacherDeckItem }
  | { ok: false; values: CreateDeckValues; errors: CreateDeckErrors };

export type CreateDeckCall = (input: CreateDeckInput, image: File | null) => Promise<TeacherDeckItem>;

/**
 * Kiểm rồi gọi API. Thất bại luôn trả lại nguyên `values` (tên, ảnh, danh mục) để biểu mẫu giữ dữ liệu và cho tạo lại
 * (AC-BT-10, 12, 13). `create` ném `DeckApiError` như `deckManageApi.createTeacherDeck`.
 */
export async function submitCreateDeck(values: CreateDeckValues, create: CreateDeckCall): Promise<SubmitResult> {
  const errors = validateCreateDeck(values);
  if (Object.keys(errors).length > 0) return { ok: false, values, errors };
  try {
    const deck = await create(toCreateDeckInput(values), values.image);
    return { ok: true, deck };
  } catch (error) {
    const apiError = error as DeckApiError;
    return { ok: false, values, errors: apiError && apiError.kind ? errorsFromApi(apiError) : { form: "failed" } };
  }
}

/** "Hủy": đóng biểu mẫu, không gửi gì, đặt lại về rỗng (AC-BT-09). */
export function cancelCreateDeck(): CreateDeckValues {
  return { ...EMPTY_CREATE_DECK };
}
