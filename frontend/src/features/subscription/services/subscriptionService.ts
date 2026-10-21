import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/lesson/types";
import type { PlanCode, PlanResponse } from "../types";

export const subscriptionService = {
  getMyPlan: async (): Promise<PlanResponse> => {
    const response = await axiosClient.get<ApiResponse<PlanResponse>>("/subscriptions/me");
    return response.data.data;
  },

  /** Chỉ dùng khi bật công cụ thử (VITE_DEV_TOOLS và app.dev-tools.enabled ở backend). */
  devSetPlan: async (plan: PlanCode): Promise<PlanResponse> => {
    const response = await axiosClient.put<ApiResponse<PlanResponse>>("/dev/plan", { plan });
    return response.data.data;
  },

  devResetUsage: async (): Promise<void> => {
    await axiosClient.post("/dev/usage/reset");
  },
};
