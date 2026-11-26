import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import { toAdminApiError } from "@/features/user";
import type { AuditDetail, AuditFilter, AuditPage, AuditRow } from "./types";

const LOGS = "/admin/audit-logs";
const REQUEST_TIMEOUT_MS = 15_000;

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/** Bỏ điều kiện lọc rỗng để backend hiểu là "không lọc". */
function filterParams(filter: AuditFilter, page: number): Record<string, string | number> {
  const params: Record<string, string | number> = { period: filter.period, page };
  if (filter.action) params.action = filter.action;
  if (filter.targetType) params.targetType = filter.targetType;
  if (filter.actorRole) params.actorRole = filter.actorRole;
  if (filter.q.trim()) params.q = filter.q.trim();
  return params;
}

/** Nhật ký của quản trị viên (UC-NK-01). Lỗi ném ra là `AdminApiError`. */
export const auditApi = {
  list: (filter: AuditFilter, page: number) =>
    call<AuditPage<AuditRow>>(
      axiosClient.get(LOGS, { params: filterParams(filter, page), timeout: REQUEST_TIMEOUT_MS }),
    ),
  detail: (id: number) => call<AuditDetail>(axiosClient.get(`${LOGS}/${id}`, { timeout: REQUEST_TIMEOUT_MS })),
};
