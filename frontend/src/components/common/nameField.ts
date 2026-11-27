/** Độ dài tối đa của tên chủ đề và tên danh mục (BR-CD-01, BR-CD-02). */
export const CATALOG_NAME_MAX = 100;

export type NameError = "required" | "tooLong";

/** Kiểm tên sau khi bỏ khoảng trắng hai đầu: bắt buộc, dài 1 đến {@link max} ký tự. */
export function validateName(raw: string, max: number = CATALOG_NAME_MAX): NameError | null {
  const name = raw.trim();
  if (name.length === 0) return "required";
  if (name.length > max) return "tooLong";
  return null;
}

/** Kết quả lưu tên: lỗi gắn cạnh ô tên (vd trùng tên) hoặc thông báo chung (vd mất kết nối). */
export type NameSubmitResult = { ok: true } | { ok: false; fieldError?: string; notice?: string };
