import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { subscriptionService } from "../services/subscriptionService";

export const PLAN_QUERY_KEY = ["subscription", "plan"] as const;

/** Gói hiện tại do server tính (`GET /subscriptions/me`). Chưa tải xong thì coi là Free. */
export const useMyPlan = (enabled = true) => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: PLAN_QUERY_KEY,
    queryFn: () => subscriptionService.getMyPlan(),
    enabled: enabled && hasToken,
  });
};
