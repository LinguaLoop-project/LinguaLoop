import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import { toAdminApiError } from "@/features/user";
import type { CreditConfig, UpdateCreditConfigInput } from "./types";

const CONFIG = "/admin/credit-config";
const REQUEST_TIMEOUT_MS = 15_000;

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/** Cấu hình credit của quản trị viên (UC-GA-01, UC-GA-02). Lỗi ném ra là `AdminApiError`. */
export const creditAdminApi = {
  get: () => call<CreditConfig>(axiosClient.get(CONFIG, { timeout: REQUEST_TIMEOUT_MS })),
  update: (input: UpdateCreditConfigInput) =>
    call<CreditConfig>(axiosClient.put(CONFIG, input, { timeout: REQUEST_TIMEOUT_MS })),
};
