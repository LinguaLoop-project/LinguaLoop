import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/lesson/types";
import type { Checkout, CreditBalance, CreditPrices, OrderKind, PlanCode, PlanResponse, ProOrder, SalePlan } from "../types";

export const subscriptionService = {
  getMyPlan: async (): Promise<PlanResponse> => {
    const response = await axiosClient.get<ApiResponse<PlanResponse>>("/subscriptions/me");
    return response.data.data;
  },

  /** Gói Pro đang bán (BR-PR-11). */
  getPlans: async (): Promise<SalePlan[]> => {
    const response = await axiosClient.get<ApiResponse<SalePlan[]>>("/subscriptions/plans");
    return response.data.data;
  },

  /** Tạo đơn nâng cấp hoặc gia hạn; server hủy đơn chờ cũ (BR-PR-16) và trả đường dẫn VNPAY. */
  checkout: async (planId: string, kind: OrderKind): Promise<Checkout> => {
    const response = await axiosClient.post<ApiResponse<Checkout>>("/subscriptions/orders", { planId, kind });
    return response.data.data;
  },

  /** Lịch sử đơn của chính mình, mới nhất trước (BR-PR-03). */
  getOrders: async (): Promise<ProOrder[]> => {
    const response = await axiosClient.get<ApiResponse<ProOrder[]>>("/subscriptions/orders");
    return response.data.data;
  },

  getOrder: async (orderId: string): Promise<ProOrder> => {
    const response = await axiosClient.get<ApiResponse<ProOrder>>(`/subscriptions/orders/${orderId}`);
    return response.data.data;
  },

  /** Gửi nguyên tham số VNPAY mang về qua Return URL để server kiểm chữ ký và ghi nhận (BR-PR-08). */
  confirmReturn: async (params: Record<string, string>): Promise<ProOrder> => {
    const response = await axiosClient.get<ApiResponse<ProOrder>>("/subscriptions/orders/vnpay-return", { params });
    return response.data.data;
  },

  getCredit: async (): Promise<CreditBalance> => {
    const response = await axiosClient.get<ApiResponse<CreditBalance>>("/credits/balance");
    return response.data.data;
  },

  getPrices: async (): Promise<CreditPrices> => {
    const response = await axiosClient.get<ApiResponse<CreditPrices>>("/credits/prices");
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
