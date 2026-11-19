import { axiosClient } from "@/api/axiosClient";
import { uploadFile } from "@/api/fileUpload";
import { toDeckApiError } from "./deckManageApi";
import { contentApiBase } from "./deckManagePaths";
import type { ContentRole, DeckCard, DeckGroup } from "./deckManageTypes";
import type {
  AttachImageItem,
  AttachImagesResult,
  CardInput,
  ImportPreview,
  ImportResult,
  TemplateFormat,
} from "./deckContentTypes";
import type { ApiResponse } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;
/** Nhập tới 500 dòng mất lâu hơn một lệnh lưu thường. */
const IMPORT_TIMEOUT_MS = 60_000;

async function wrap<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toDeckApiError(error);
  }
}

const groupsPath = (deckId: string, role: ContentRole) => `${contentApiBase(role)}/${deckId}/groups`;
const cardsPath = (deckId: string, groupId: string, role: ContentRole) =>
  `${groupsPath(deckId, role)}/${groupId}/cards`;

function fileForm(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

/**
 * API nhóm thẻ và thẻ (UC-NT-01 đến 07 của giáo viên, UC-HT-09 của học viên); `role` mặc định là giáo viên, `learner` trỏ
 * tới bộ cá nhân và không có ảnh. Lỗi ném ra luôn là `DeckApiError`.
 */
export const deckContentApi = {
  addGroup: (deckId: string, name: string, role: ContentRole = "teacher"): Promise<DeckGroup> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<DeckGroup>>(groupsPath(deckId, role), { name: name.trim() }, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  renameGroup: (deckId: string, groupId: string, name: string, role: ContentRole = "teacher"): Promise<DeckGroup> =>
    wrap(async () => {
      const response = await axiosClient.put<ApiResponse<DeckGroup>>(
        `${groupsPath(deckId, role)}/${groupId}`,
        { name: name.trim() },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  deleteGroup: (deckId: string, groupId: string, role: ContentRole = "teacher"): Promise<void> =>
    wrap(async () => {
      await axiosClient.delete(`${groupsPath(deckId, role)}/${groupId}`, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /**
   * Thêm thẻ (UC-NT-04). Có ảnh thì tải thẳng lên S3 trước (mục đích `CARD_IMAGE`) rồi gửi `imageKey`; mỗi lần gửi tải
   * ảnh mới vì server bỏ ảnh của lần lưu thất bại.
   */
  addCard: (
    deckId: string,
    groupId: string,
    card: CardInput,
    image: File | null,
    role: ContentRole = "teacher",
  ): Promise<DeckCard> =>
    wrap(async () => {
      const imageKey = image ? await uploadFile("CARD_IMAGE", image) : null;
      const response = await axiosClient.post<ApiResponse<DeckCard>>(
        cardsPath(deckId, groupId, role),
        { ...card, imageKey },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Sửa thẻ (UC-NT-05): ảnh mới tải lên như khi thêm; `removeImage` = bỏ ảnh; cả hai trống = giữ ảnh. */
  updateCard: (
    deckId: string,
    groupId: string,
    cardId: string,
    card: CardInput,
    image: File | null,
    removeImage: boolean,
    role: ContentRole = "teacher",
  ): Promise<DeckCard> =>
    wrap(async () => {
      const imageKey = image ? await uploadFile("CARD_IMAGE", image) : null;
      const response = await axiosClient.put<ApiResponse<DeckCard>>(
        `${cardsPath(deckId, groupId, role)}/${cardId}`,
        { ...card, imageKey, removeImage: imageKey ? false : removeImage },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Tải một ảnh lên S3 để gắn hàng loạt; lỗi là lỗi gốc (axios hoặc `FileUploadError`) để đếm ảnh tải thất bại. */
  uploadCardImage: (file: File): Promise<string> => uploadFile("CARD_IMAGE", file),

  /** Gắn ảnh đã tải lên cho thẻ của nhóm, ghép theo tên tệp; tối đa 100 ảnh mỗi lần (UC-NT-08). */
  attachImages: (deckId: string, groupId: string, items: AttachImageItem[]): Promise<AttachImagesResult> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<AttachImagesResult>>(
        `${cardsPath(deckId, groupId, "teacher")}/images`,
        { items },
        { timeout: IMPORT_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  deleteCard: (deckId: string, groupId: string, cardId: string, role: ContentRole = "teacher"): Promise<void> =>
    wrap(async () => {
      await axiosClient.delete(`${cardsPath(deckId, groupId, role)}/${cardId}`, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Kiểm tệp và trả số thẻ sẽ thêm, chưa ghi gì (UC-NT-07 bước 7). */
  previewImport: (deckId: string, groupId: string, file: File, role: ContentRole = "teacher"): Promise<ImportPreview> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<ImportPreview>>(
        `${cardsPath(deckId, groupId, role)}/import/preview`,
        fileForm(file),
        { timeout: IMPORT_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Thêm mọi thẻ trong tệp vào cuối nhóm; có dòng lỗi thì không thêm thẻ nào (UC-NT-07 bước 9). */
  importCards: (deckId: string, groupId: string, file: File, role: ContentRole = "teacher"): Promise<ImportResult> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<ImportResult>>(
        `${cardsPath(deckId, groupId, role)}/import`,
        fileForm(file),
        { timeout: IMPORT_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Tải tệp mẫu (AC-NT-49). Cần phiên đăng nhập nên tải qua axios rồi lưu, không dùng liên kết thường. */
  downloadTemplate: (format: TemplateFormat, role: ContentRole = "teacher"): Promise<void> =>
    wrap(async () => {
      const response = await axiosClient.get<Blob>(`${contentApiBase(role)}/card-import-template`, {
        params: { format },
        responseType: "blob",
        timeout: REQUEST_TIMEOUT_MS,
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mau-nhap-the.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }),
};
