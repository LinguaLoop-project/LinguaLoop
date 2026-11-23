import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import { toAdminApiError } from "@/features/user";

/** Một gói Pro trên màn quản trị (`GET /admin/pro-plans`, UC-GA-03). `purchases` = số đơn đã thanh toán. */
export interface ProPlan {
  id: string;
  name: string;
  months: number;
  priceVnd: number;
  creditsPerMonth: number;
  onSale: boolean;
  purchases: number;
  /** Gửi lại khi sửa để phát hiện người khác vừa sửa (UC-GA-05 7a). */
  version: string;
}

export interface ProPlanInput {
  name: string;
  months: number;
  priceVnd: number;
  creditsPerMonth: number;
}

const PLANS = "/admin/pro-plans";
const REQUEST_TIMEOUT_MS = 15_000;

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/** Quản lý gói Pro của quản trị viên (UC-GA-03 đến 06). Lỗi ném ra là `AdminApiError`. */
export const adminPlanService = {
  list: () => call<ProPlan[]>(axiosClient.get(PLANS, { timeout: REQUEST_TIMEOUT_MS })),
  create: (input: ProPlanInput) => call<ProPlan>(axiosClient.post(PLANS, input, { timeout: REQUEST_TIMEOUT_MS })),
  update: (id: string, version: string, input: ProPlanInput) =>
    call<ProPlan>(axiosClient.put(`${PLANS}/${id}`, { version, ...input }, { timeout: REQUEST_TIMEOUT_MS })),
  setOnSale: (id: string, onSale: boolean) =>
    call<ProPlan>(axiosClient.post(`${PLANS}/${id}/on-sale`, { onSale }, { timeout: REQUEST_TIMEOUT_MS })),
};
