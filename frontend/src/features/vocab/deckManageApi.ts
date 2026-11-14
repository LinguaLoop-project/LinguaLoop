import { isAxiosError } from "axios";
import { axiosClient } from "@/api/axiosClient";
import { uploadFile } from "@/api/fileUpload";
import type { ApiResponse } from "./types";
import type {
  AdminDeckItem,
  CategoryOption,
  CreateDeckInput,
  DeckApiError,
  DeckCard,
  DeckDetail,
  DeckFieldError,
  DeckListFilter,
  ManageRole,
  Page,
  TeacherDeckItem,
  UpdateDeckInput,
} from "./deckManageTypes";

const REQUEST_TIMEOUT_MS = 15_000;

type Params = Record<string, string | number | boolean>;

/** Tham số chung của hai vai trò; bỏ tham số rỗng để URL gọn và server dùng mặc định. */
function commonParams(filter: DeckListFilter, page: number): Params {
  const params: Params = { page };
  const q = filter.q.trim();
  if (q) params.q = q;
  if (filter.other) params.other = true;
  else if (filter.categoryId) params.categoryId = filter.categoryId;
  if (filter.pro) params.pro = true;
  return params;
}

export function teacherListParams(filter: DeckListFilter, page: number): Params {
  const params = commonParams(filter, page);
  if (filter.status !== "all") params.status = filter.status;
  return params;
}

export function adminListParams(filter: DeckListFilter, page: number): Params {
  const params = commonParams(filter, page);
  if (filter.system) params.system = true;
  else if (filter.ownerId) params.ownerId = filter.ownerId;
  return params;
}

/** Đổi lỗi axios thành `DeckApiError`; không có phản hồi (mất mạng, hết thời gian) là "network". */
export function toDeckApiError(error: unknown): DeckApiError {
  if (!isAxiosError(error)) {
    return { kind: "unknown", status: null, message: null, fieldErrors: [] };
  }
  const status = error.response?.status ?? null;
  const body = error.response?.data as
    | { message?: string; code?: string; errors?: DeckFieldError[]; details?: Record<string, unknown> }
    | undefined;
  const base = {
    status,
    message: body?.message ?? null,
    fieldErrors: (body?.errors ?? []).map(({ field, code }) => ({ field, code })),
    code: body?.code ?? null,
    details: body?.details ?? {},
  };
  if (status === null) return { kind: "network", ...base };
  if (status === 401) return { kind: "unauthorized", ...base };
  if (status === 403) return { kind: "forbidden", ...base };
  if (status === 404) return { kind: "notFound", ...base };
  if (status === 409) return { kind: "conflict", ...base };
  if (status === 400) return { kind: "validation", ...base };
  if (status >= 500) return { kind: "server", ...base };
  return { kind: "unknown", ...base };
}

async function wrap<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toDeckApiError(error);
  }
}

/** API quản lý bộ thẻ; lỗi ném ra luôn là `DeckApiError`. */
export const deckManageApi = {
  /** Bộ của giáo viên đang đăng nhập (`GET /teacher/vocab/decks`). */
  fetchTeacherDecks: (filter: DeckListFilter, page: number): Promise<Page<TeacherDeckItem>> =>
    wrap(async () => {
      const response = await axiosClient.get<ApiResponse<Page<TeacherDeckItem>>>("/teacher/vocab/decks", {
        params: teacherListParams(filter, page),
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  /** Bộ Đã xuất bản của mọi giáo viên và bộ hệ thống (`GET /admin/vocab/decks`). */
  fetchAdminDecks: (filter: DeckListFilter, page: number): Promise<Page<AdminDeckItem>> =>
    wrap(async () => {
      const response = await axiosClient.get<ApiResponse<Page<AdminDeckItem>>>("/admin/vocab/decks", {
        params: adminListParams(filter, page),
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  /** Mọi danh mục theo thứ tự hiển thị, để lọc danh sách và chọn khi tạo bộ (`GET /{role}/vocab/categories`). */
  fetchCategories: (role: ManageRole): Promise<CategoryOption[]> =>
    wrap(async () => {
      const response = await axiosClient.get<ApiResponse<CategoryOption[]>>(`/${role}/vocab/categories`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  /**
   * Tạo bộ Nháp (`POST /teacher/vocab/decks`). Có ảnh thì tải thẳng lên S3 trước rồi gửi `imageKey`; mỗi lần gửi tải
   * ảnh mới vì server bỏ ảnh của lần tạo thất bại.
   */
  createTeacherDeck: (input: CreateDeckInput, image: File | null): Promise<TeacherDeckItem> =>
    wrap(async () => {
      const imageKey = image ? await uploadFile("DECK_IMAGE", image) : null;
      const response = await axiosClient.post<ApiResponse<TeacherDeckItem>>(
        "/teacher/vocab/decks",
        { ...input, imageKey },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Thông tin chung và nhóm thẻ của một bộ (`GET /{role}/vocab/decks/{id}`, UC-BT-04). */
  fetchDeckDetail: (role: ManageRole, deckId: string): Promise<DeckDetail> =>
    wrap(async () => {
      const response = await axiosClient.get<ApiResponse<DeckDetail>>(`/${role}/vocab/decks/${deckId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data.data;
    }),

  /** Thẻ của một nhóm, 20 thẻ mỗi trang; `q` tìm theo từ vựng (BR-BT-15). */
  fetchGroupCards: (
    role: ManageRole,
    deckId: string,
    groupId: string,
    q: string,
    page: number,
  ): Promise<Page<DeckCard>> =>
    wrap(async () => {
      const params: Params = { page };
      if (q.trim()) params.q = q.trim();
      const response = await axiosClient.get<ApiResponse<Page<DeckCard>>>(
        `/${role}/vocab/decks/${deckId}/groups/${groupId}/cards`,
        { params, timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Sửa bộ (`PUT /teacher/vocab/decks/{id}`, UC-BT-03); ảnh mới tải lên S3 trước như khi tạo bộ. */
  updateTeacherDeck: (deckId: string, input: UpdateDeckInput, image: File | null): Promise<DeckDetail> =>
    wrap(async () => {
      const imageKey = image ? await uploadFile("DECK_IMAGE", image) : null;
      const response = await axiosClient.put<ApiResponse<DeckDetail>>(
        `/teacher/vocab/decks/${deckId}`,
        { ...input, removeImage: imageKey ? false : input.removeImage, imageKey },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data.data;
    }),

  /** Xuất bản bộ Nháp (UC-BT-05). */
  publishDeck: (deckId: string): Promise<void> =>
    wrap(async () => {
      await axiosClient.post(`/teacher/vocab/decks/${deckId}/publish`, null, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Gỡ xuất bản (UC-BT-06); quản trị viên gửi kèm lý do (BR-BT-08). */
  unpublishDeck: (role: ManageRole, deckId: string, reason: string | null): Promise<void> =>
    wrap(async () => {
      await axiosClient.post(`/${role}/vocab/decks/${deckId}/unpublish`, role === "admin" ? { reason } : null, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    }),

  /** Xóa tạm bộ, giữ 30 ngày (UC-BT-07). */
  deleteDeck: (deckId: string): Promise<void> =>
    wrap(async () => {
      await axiosClient.delete(`/teacher/vocab/decks/${deckId}`, { timeout: REQUEST_TIMEOUT_MS });
    }),

  /** Khôi phục bộ đã xóa về Nháp; `name` chỉ gửi khi tên cũ đã bị trùng (UC-BT-08 6a). */
  restoreDeck: (deckId: string, name: string | null): Promise<void> =>
    wrap(async () => {
      await axiosClient.post(`/teacher/vocab/decks/${deckId}/restore`, name ? { name: name.trim() } : {}, {
        timeout: REQUEST_TIMEOUT_MS,
      });
    }),
};
