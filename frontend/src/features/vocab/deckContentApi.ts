import { axiosClient } from "@/api/axiosClient";
import { uploadFile } from "@/api/fileUpload";
import { toDeckApiError } from "./deckManageApi";
import type { DeckCard, DeckGroup } from "./deckManageTypes";
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

const groupsPath = (deckId: string) => `/teacher/vocab/decks/${deckId}/groups`;
const cardsPath = (deckId: string, groupId: string) => `${groupsPath(deckId)}/${groupId}/cards`;

function fileForm(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

/** API nhóm thẻ và thẻ của giáo viên (UC-NT-01 đến 07); lỗi ném ra luôn là `DeckApiError`. */
export const deckContentApi = {
  addGroup: (deckId: string, name: string): Promise<DeckGroup> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<DeckGroup>>(groupsPath(deckId), { name: name.trim() }, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  renameGroup: (deckId: string, groupId: string, name: string): Promise<DeckGroup> =>
    wrap(async () => {
      const response = await axiosClient.put<ApiResponse<DeckGroup>>(
        `${groupsPath(deckId)}/${groupId}`,
        { name: name.trim() },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  deleteGroup: (deckId: string, groupId: string): Promise<void> =>
    wrap(async () => {
      await axiosClient.delete(`${groupsPath(deckId)}/${groupId}`, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /**
   * Thêm thẻ (UC-NT-04). Có ảnh thì tải thẳng lên S3 trước (mục đích `CARD_IMAGE`) rồi gửi `imageKey`; mỗi lần gửi tải
   * ảnh mới vì server bỏ ảnh của lần lưu thất bại.
   */
  addCard: (deckId: string, groupId: string, card: CardInput, image: File | null): Promise<DeckCard> =>
    wrap(async () => {
      const imageKey = image ? await uploadFile("CARD_IMAGE", image) : null;
      const response = await axiosClient.post<ApiResponse<DeckCard>>(
        cardsPath(deckId, groupId),
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
  ): Promise<DeckCard> =>
    wrap(async () => {
      const imageKey = image ? await uploadFile("CARD_IMAGE", image) : null;
      const response = await axiosClient.put<ApiResponse<DeckCard>>(
        `${cardsPath(deckId, groupId)}/${cardId}`,
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
        `${cardsPath(deckId, groupId)}/images`,
        { items },
        { timeout: IMPORT_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  deleteCard: (deckId: string, groupId: string, cardId: string): Promise<void> =>
    wrap(async () => {
      await axiosClient.delete(`${cardsPath(deckId, groupId)}/${cardId}`, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Kiểm tệp và trả số thẻ sẽ thêm, chưa ghi gì (UC-NT-07 bước 7). */
  previewImport: (deckId: string, groupId: string, file: File): Promise<ImportPreview> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<ImportPreview>>(
        `${cardsPath(deckId, groupId)}/import/preview`,
        fileForm(file),
        { timeout: IMPORT_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Thêm mọi thẻ trong tệp vào cuối nhóm; có dòng lỗi thì không thêm thẻ nào (UC-NT-07 bước 9). */
  importCards: (deckId: string, groupId: string, file: File): Promise<ImportResult> =>
    wrap(async () => {
      const response = await axiosClient.post<ApiResponse<ImportResult>>(
        `${cardsPath(deckId, groupId)}/import`,
        fileForm(file),
        { timeout: IMPORT_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Tải tệp mẫu (AC-NT-49). Cần phiên đăng nhập nên tải qua axios rồi lưu, không dùng liên kết thường. */
  downloadTemplate: (format: TemplateFormat): Promise<void> =>
    wrap(async () => {
      const response = await axiosClient.get<Blob>("/teacher/vocab/decks/card-import-template", {
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
