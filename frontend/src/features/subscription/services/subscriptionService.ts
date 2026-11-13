import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/lesson/types";
import type { CreditBalance, PlanCode, PlanResponse } from "../types";

export const subscriptionService = {
  getMyPlan: async (): Promise<PlanResponse> => {
    const response = await axiosClient.get<ApiResponse<PlanResponse>>("/subscriptions/me");
    return response.data.data;
  },

  getCredit: async (): Promise<CreditBalance> => {
    const response = await axiosClient.get<ApiResponse<CreditBalance>>("/credits/balance");
    return response.data.data;
  },

  /** Chỉ dùng khi bật công cụ thử (VITE_DEV_TOOLS và app.dev-tools.enabled ở backend). */
  devSetPlan: async (plan: PlanCode): Promise<PlanResponse> => {
    const response = await axiosClient.put<ApiResponse<PlanResponse>>("/dev/plan", { plan });
    return response.data.data;
  },

  /** Đặt số dư ví credit của chính mình (công cụ thử). */
  devSetCredits: async (balance: number): Promise<void> => {
    await axiosClient.put("/dev/credits", { balance });
  },
};
