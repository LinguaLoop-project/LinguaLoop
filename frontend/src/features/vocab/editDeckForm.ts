// Biểu mẫu sửa bộ thẻ (UC-BT-03, BR-BT-03, 13, 14): cùng quy tắc với biểu mẫu tạo bộ, thêm "Xóa ảnh" (luồng 3a).
import { errorsFromApi, validateDeckImage, validateDeckName, type CreateDeckErrors } from "./createDeckForm";
import type { DeckApiError, DeckDetail, UpdateDeckInput } from "./deckManageTypes";

export interface EditDeckValues {
  name: string;
  categoryId: string | null;
  pro: boolean;
  /** Ảnh mới chọn; `null` = không đổi ảnh (hoặc xóa ảnh nếu `removeImage`). */
  image: File | null;
  removeImage: boolean;
}

/**
 * `form`: "failed" = mất kết nối hoặc lỗi máy chủ, giữ biểu mẫu (AC-BT-21); "notFound" = bộ đã bị xóa (AC-BT-18);
 * "forbidden" = bộ của giáo viên khác (AC-BT-17).
 */
export type EditDeckErrors = Omit<CreateDeckErrors, "form"> & { form?: "failed" | "notFound" | "forbidden" };

export function editValuesFromDetail(detail: DeckDetail): EditDeckValues {
  return { name: detail.name, categoryId: detail.categoryId, pro: detail.pro, image: null, removeImage: false };
}

/** Có thay đổi chưa lưu so với bộ hiện tại không (để hiện thanh "Lưu / Hủy"). Tên so sánh sau khi cắt khoảng trắng. */
export function isEditDirty(values: EditDeckValues, detail: DeckDetail): boolean {
  return (
    values.name.trim() !== detail.name ||
    values.categoryId !== detail.categoryId ||
    values.pro !== detail.pro ||
    values.image !== null ||
    (values.removeImage && detail.imageUrl !== null)
  );
}

export function validateEditDeck(values: EditDeckValues): EditDeckErrors {
  const errors: EditDeckErrors = {};
  const name = validateDeckName(values.name);
  if (name) errors.name = name;
  const image = validateDeckImage(values.image);
  if (image) errors.image = image;
  return errors;
}

export function toUpdateDeckInput(values: EditDeckValues): UpdateDeckInput {
  return {
    name: values.name.trim(),
    categoryId: values.categoryId,
    pro: values.pro,
    removeImage: values.image === null && values.removeImage,
  };
}

export function editErrorsFromApi(error: DeckApiError): EditDeckErrors {
  if (error.kind === "notFound") return { form: "notFound" };
  if (error.kind === "forbidden") return { form: "forbidden" };
  return errorsFromApi(error);
}

export type UpdateDeckCall = (input: UpdateDeckInput, image: File | null) => Promise<DeckDetail>;

export type SubmitEditResult =
  | { ok: true; deck: DeckDetail }
  | { ok: false; values: EditDeckValues; errors: EditDeckErrors };

/** Kiểm rồi gọi API; thất bại luôn trả lại nguyên `values` để biểu mẫu giữ các thay đổi (AC-BT-19, 21). */
export async function submitEditDeck(values: EditDeckValues, update: UpdateDeckCall): Promise<SubmitEditResult> {
  const errors = validateEditDeck(values);
  if (Object.keys(errors).length > 0) return { ok: false, values, errors };
  try {
    const deck = await update(toUpdateDeckInput(values), values.image);
    return { ok: true, deck };
  } catch (error) {
    const apiError = error as DeckApiError;
    return { ok: false, values, errors: apiError && apiError.kind ? editErrorsFromApi(apiError) : { form: "failed" } };
  }
}
