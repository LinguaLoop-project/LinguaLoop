/** Cạnh ảnh đại diện sau khi cắt (px); đủ nét cho khung 80px trên màn hình mật độ cao và nhẹ vài chục KB. */
export const AVATAR_SIZE = 512;
/** Ảnh gốc lớn hơn mức này bị từ chối ngay, trước khi giải mã (tránh treo trình duyệt với tệp quá nặng). */
export const AVATAR_MAX_INPUT_BYTES = 10 * 1024 * 1024;
/** Loại tệp chọn được; backend nhận JPG, PNG, WebP sau khi nén. */
export const AVATAR_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type AvatarProblem = "type" | "size";

/** Kiểm tệp học viên chọn trước khi xử lý; trả `null` nếu hợp lệ. */
export function avatarProblem(file: { type: string; size: number }): AvatarProblem | null {
  if (!AVATAR_INPUT_TYPES.includes(file.type)) return "type";
  if (file.size > AVATAR_MAX_INPUT_BYTES) return "size";
  return null;
}

/** Hình vuông lớn nhất nằm giữa ảnh `width` x `height`: nguồn cắt `(sx, sy, side)` của canvas. */
export function squareCrop(width: number, height: number): { sx: number; sy: number; side: number } {
  const side = Math.min(width, height);
  return { sx: Math.floor((width - side) / 2), sy: Math.floor((height - side) / 2), side };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Cắt vuông ở giữa, thu về `AVATAR_SIZE` rồi nén (ưu tiên WebP, trình duyệt không hỗ trợ thì JPEG) để tệp tải lên nhẹ và
 * đúng loại backend nhận. Ném lỗi nếu không giải mã được ảnh.
 */
export async function cropAndCompressAvatar(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const { sx, sy, side } = squareCrop(bitmap.width, bitmap.height);
    const target = Math.min(AVATAR_SIZE, side);
    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target);
    const webp = await toBlob(canvas, "image/webp", 0.85);
    const blob = webp && webp.type === "image/webp" ? webp : await toBlob(canvas, "image/jpeg", 0.88);
    if (!blob) throw new Error("encode failed");
    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `avatar.${extension}`, { type: blob.type });
  } finally {
    bitmap.close();
  }
}
