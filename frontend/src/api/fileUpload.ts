import { axiosClient } from "./axiosClient";

/** Mục đích tải tệp; khớp enum `UploadPurpose` ở backend, quyết định thư mục, loại tệp và dung lượng cho phép. */
export type UploadPurpose = "DECK_IMAGE" | "CARD_IMAGE";

interface PresignedUpload {
  key: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
}

const UPLOAD_TIMEOUT_MS = 60_000;

/** S3 từ chối hoặc không nhận tệp (URL hết hạn, sai Content-Type/kích thước, mất mạng giữa chừng). */
export class FileUploadError extends Error {
  readonly status: number | null;

  constructor(status: number | null, message = "Tải tệp lên không thành công") {
    super(message);
    this.name = "FileUploadError";
    this.status = status;
  }
}

/**
 * Tải tệp thẳng lên S3 qua presigned URL rồi trả `key` để gửi kèm request nghiệp vụ (vd `imageKey` khi tạo bộ).
 * Bước xin URL lỗi thì ném lỗi axios như các API khác (400 kèm `errors` trên trường `contentType` hoặc `size`).
 * Bước PUT dùng `fetch` chứ không dùng `axiosClient`, vì S3 từ chối request có thêm header `Authorization`.
 */
export async function uploadFile(purpose: UploadPurpose, file: File): Promise<string> {
  const response = await axiosClient.post<{ data: PresignedUpload }>("/uploads/presign", {
    purpose,
    contentType: file.type,
    size: file.size,
  });
  const presigned = response.data.data;

  let upload: Response;
  try {
    upload = await fetch(presigned.uploadUrl, {
      method: presigned.method,
      headers: presigned.headers,
      body: file,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });
  } catch {
    throw new FileUploadError(null);
  }
  if (!upload.ok) throw new FileUploadError(upload.status);
  return presigned.key;
}
