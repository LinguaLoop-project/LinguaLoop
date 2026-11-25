import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import { toAdminApiError } from "@/features/user";
import type { AiUsageStats, OverviewStats, PlanFilter, PracticeStats, StatsPeriod } from "./types";

const STATS = "/admin/stats";
const REQUEST_TIMEOUT_MS = 20_000;

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/** Thống kê hệ thống của quản trị viên (UC-NK-02 đến 04). Lỗi ném ra là `AdminApiError`. */
export const statsApi = {
  overview: (period: StatsPeriod) =>
    call<OverviewStats>(axiosClient.get(`${STATS}/overview`, { params: { period }, timeout: REQUEST_TIMEOUT_MS })),
  practice: (period: StatsPeriod, plan: PlanFilter) =>
    call<PracticeStats>(
      axiosClient.get(`${STATS}/practice`, { params: { period, plan }, timeout: REQUEST_TIMEOUT_MS }),
    ),
  aiUsage: (period: StatsPeriod) =>
    call<AiUsageStats>(axiosClient.get(`${STATS}/ai-usage`, { params: { period }, timeout: REQUEST_TIMEOUT_MS })),
};
