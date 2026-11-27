import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import { toAdminApiError } from "@/features/user";
import type { AdminCategory } from "./categoryAdmin";

const CATEGORIES = "/admin/vocab/categories";
const REQUEST_TIMEOUT_MS = 15_000;

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/** Quản lý danh mục bộ thẻ của quản trị viên (UC-CD-04 đến 06). Lỗi ném ra là `AdminApiError`. */
export const categoryAdminApi = {
  list: (q: string) =>
    call<AdminCategory[]>(
      axiosClient.get(CATEGORIES, { params: q.trim() ? { q: q.trim() } : {}, timeout: REQUEST_TIMEOUT_MS }),
    ),
  create: (name: string) =>
    call<AdminCategory>(axiosClient.post(CATEGORIES, { name }, { timeout: REQUEST_TIMEOUT_MS })),
  rename: (id: string, name: string) =>
    call<AdminCategory>(axiosClient.put(`${CATEGORIES}/${id}`, { name }, { timeout: REQUEST_TIMEOUT_MS })),
};
