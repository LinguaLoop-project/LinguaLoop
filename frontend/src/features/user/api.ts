import { isAxiosError } from "axios";
import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse, MeResponse } from "@/features/auth";
import type {
  AdminApiError,
  AdminUserDetail,
  AdminUserRow,
  ChangeableRole,
  Page,
  TeacherSummary,
  TransferFilter,
  TransferItem,
  TransferOwner,
  TransferRecipient,
  TransferResult,
  UserListFilter,
} from "./types";

export type ChangePasswordPayload = {
  /** Bắt buộc khi tài khoản đã có mật khẩu; bỏ qua với tài khoản Google chưa tạo mật khẩu. */
  currentPassword?: string;
  newPassword: string;
};

export type LearningProfilePayload = {
  displayName: string;
  dailyMinutes: number;
  uiLanguage: "vi" | "en";
  timezone: string;
  /** Bắt buộc là true khi học viên chưa từng đồng ý điều khoản (BR-TK-14). */
  acceptTerms: boolean;
};

export const userApi = {
  /** Lưu hồ sơ học tập (UC-TK-08). Lần đầu thành công thì học viên được đánh dấu đã thiết lập hồ sơ. */
  saveLearningProfile: (payload: LearningProfilePayload) => {
    return axiosClient.put<ApiResponse<MeResponse>>("/users/me/learning-profile", payload);
  },

  // 204. Thành công thì các phiên khác bị thu hồi, phiên hiện tại giữ nguyên.
  changePassword: (payload: ChangePasswordPayload) => {
    return axiosClient.put<void>("/users/me/password", payload);
  },
};

const REQUEST_TIMEOUT_MS = 15_000;
const ADMIN_USERS = "/admin/users";
const TRANSFERS = "/admin/content-transfers";

/** Bỏ tham số rỗng để URL gọn và backend hiểu là "không lọc". */
function compact(params: Record<string, string | number>): Record<string, string | number> {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ""));
}

/** Đổi lỗi axios thành lỗi có loại để giao diện chọn thông báo (mất kết nối, xung đột, sai dữ liệu...). */
export function toAdminApiError(error: unknown): AdminApiError {
  if (!isAxiosError(error)) {
    return { kind: "unknown", status: null, code: null, message: null, fieldErrors: [], details: {} };
  }
  const status = error.response?.status ?? null;
  const body = error.response?.data as
    | {
        code?: string;
        message?: string;
        errors?: { field: string; code: string; message?: string | null }[];
        details?: Record<string, unknown>;
      }
    | undefined;
  const base = {
    status,
    code: body?.code ?? null,
    message: body?.message ?? null,
    fieldErrors: (body?.errors ?? []).map(({ field, code, message }) => ({ field, code, message: message ?? null })),
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

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/** Quản trị tài khoản và giao lại nội dung của quản trị viên (UC-QT-01 đến 07). */
export const adminUserApi = {
  list: (filter: UserListFilter, page: number) =>
    call<Page<AdminUserRow>>(
      axiosClient.get(ADMIN_USERS, {
        params: compact({ q: filter.q.trim(), role: filter.role, plan: filter.plan, status: filter.status, page }),
        timeout: REQUEST_TIMEOUT_MS,
      }),
    ),

  detail: (userId: string) =>
    call<AdminUserDetail>(axiosClient.get(`${ADMIN_USERS}/${userId}`, { timeout: REQUEST_TIMEOUT_MS })),

  lock: (userId: string, reason: string) =>
    call<AdminUserDetail>(axiosClient.post(`${ADMIN_USERS}/${userId}/lock`, { reason }, { timeout: REQUEST_TIMEOUT_MS })),

  unlock: (userId: string) =>
    call<AdminUserDetail>(axiosClient.post(`${ADMIN_USERS}/${userId}/unlock`, null, { timeout: REQUEST_TIMEOUT_MS })),

  changeRole: (userId: string, role: ChangeableRole) =>
    call<AdminUserDetail>(axiosClient.post(`${ADMIN_USERS}/${userId}/role`, { role }, { timeout: REQUEST_TIMEOUT_MS })),

  /** Cấp credit cho giáo viên kèm ghi chú (UC-GA-07). */
  grantCredit: (userId: string, credits: number, note: string) =>
    call<AdminUserDetail>(
      axiosClient.post(`${ADMIN_USERS}/${userId}/credits`, { credits, note }, { timeout: REQUEST_TIMEOUT_MS }),
    ),

  summary: (teacherId: string) =>
    call<TeacherSummary>(axiosClient.get(`${ADMIN_USERS}/${teacherId}/content-summary`, { timeout: REQUEST_TIMEOUT_MS })),

  transferAll: (teacherId: string, recipientId: string, expectedLessons: number, expectedDecks: number) =>
    call<TransferResult>(
      axiosClient.post(
        `${ADMIN_USERS}/${teacherId}/transfer-all`,
        { recipientId, expectedLessons, expectedDecks },
        { timeout: REQUEST_TIMEOUT_MS },
      ),
    ),

  transferItems: (filter: TransferFilter, page: number) =>
    call<Page<TransferItem>>(
      axiosClient.get(`${TRANSFERS}/items`, {
        params: compact({ q: filter.q.trim(), type: filter.type, owner: filter.owner, page }),
        timeout: REQUEST_TIMEOUT_MS,
      }),
    ),

  transferOwners: () => call<TransferOwner[]>(axiosClient.get(`${TRANSFERS}/owners`, { timeout: REQUEST_TIMEOUT_MS })),

  recipients: (q: string, exclude: string[]) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    exclude.forEach((id) => params.append("exclude", id));
    return call<TransferRecipient[]>(axiosClient.get(`${TRANSFERS}/recipients`, { params, timeout: REQUEST_TIMEOUT_MS }));
  },

  transferSelected: (
    recipientId: string,
    items: { type: string; id: string; ownerId: string | null }[],
  ) =>
    call<TransferResult>(
      axiosClient.post(`${TRANSFERS}/selected`, { recipientId, items }, { timeout: REQUEST_TIMEOUT_MS }),
    ),
};
