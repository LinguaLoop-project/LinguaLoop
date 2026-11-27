import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "../services/subscriptionService";
import type { OrderKind, ProOrder } from "../types";
import { PLAN_QUERY_KEY } from "./useMyPlan";
import { CREDIT_QUERY_KEY } from "./useCredit";

export const SALE_PLANS_QUERY_KEY = ["subscription", "sale-plans"] as const;
export const ORDERS_QUERY_KEY = ["subscription", "orders"] as const;

/** Gói Pro đang bán (BR-PR-11). */
export const useSalePlans = (enabled = true) =>
  useQuery({ queryKey: SALE_PLANS_QUERY_KEY, queryFn: () => subscriptionService.getPlans(), enabled });

/** Lịch sử giao dịch của chính học viên (BR-PR-03). */
export const useOrders = () => useQuery({ queryKey: ORDERS_QUERY_KEY, queryFn: () => subscriptionService.getOrders() });

/** Đọc lại gói, ví credit và lịch sử sau khi đơn đổi trạng thái: quyền lợi Pro có hiệu lực ngay (AC-PR-07). */
export function useRefreshPlan() {
  const queryClient = useQueryClient();
  return useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: PLAN_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CREDIT_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
      ]),
    [queryClient],
  );
}

/** Tạo đơn (UC-PR-02 bước 5, UC-PR-04 bước 5). Trang gọi tự chuyển sang VNPAY khi có `paymentUrl`. */
export const useCheckout = () =>
  useMutation({
    mutationFn: ({ planId, kind }: { planId: string; kind: OrderKind }) => subscriptionService.checkout(planId, kind),
  });

/** Kết quả trên trang trả về: theo tham số VNPAY, hoặc theo id đơn (gói 0 đồng, chờ IPN). */
export const usePaymentResult = (vnpParams: Record<string, string>, orderId: string | null) => {
  const fromVnpay = Object.keys(vnpParams).length > 0;
  return useQuery<ProOrder>({
    queryKey: ["subscription", "payment-result", fromVnpay ? vnpParams : orderId],
    queryFn: () =>
      fromVnpay ? subscriptionService.confirmReturn(vnpParams) : subscriptionService.getOrder(orderId as string),
    enabled: fromVnpay || !!orderId,
    retry: false,
    staleTime: Infinity,
  });
};

/** Đơn còn chờ VNPAY xác nhận: đọc lại vài giây một lần cho tới khi đổi trạng thái (AC-PR-18). */
export const usePendingOrder = (orderId: string | null) =>
  useQuery<ProOrder>({
    queryKey: ["subscription", "order", orderId],
    queryFn: () => subscriptionService.getOrder(orderId as string),
    enabled: !!orderId,
    refetchInterval: (query) => (query.state.data && query.state.data.status !== "pending" ? false : 3000),
  });
