import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { subscriptionService } from "../services/subscriptionService";

export const CREDIT_QUERY_KEY = ["subscription", "credit"] as const;

/** Số dư ví credit AI của người dùng (`GET /credits/balance`); server tự làm mới ví khi đọc. */
export const useCreditBalance = () => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: CREDIT_QUERY_KEY,
    queryFn: () => subscriptionService.getCredit(),
    enabled: hasToken,
    staleTime: 30_000,
  });
};

export const CREDIT_PRICES_QUERY_KEY = ["subscription", "credit-prices"] as const;

/** Credit mỗi đơn vị của từng tính năng, để hiện giá trên nút trước khi dùng (BR-GA-06). Quản trị viên ít khi đổi. */
export const useCreditPrices = () => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: CREDIT_PRICES_QUERY_KEY,
    queryFn: () => subscriptionService.getPrices(),
    enabled: hasToken,
    staleTime: 5 * 60_000,
  });
};
