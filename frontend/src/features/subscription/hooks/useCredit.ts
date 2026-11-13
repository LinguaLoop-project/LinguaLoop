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
