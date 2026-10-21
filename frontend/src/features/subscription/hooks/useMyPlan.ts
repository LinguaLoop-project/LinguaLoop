import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { subscriptionService } from "../services/subscriptionService";

export const PLAN_QUERY_KEY = ["subscription", "plan"] as const;

/** Gói hiện tại do server tính (view v_user_plan). Chưa tải xong thì coi là Free. */
export const useMyPlan = () => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: PLAN_QUERY_KEY,
    queryFn: () => subscriptionService.getMyPlan(),
    enabled: hasToken,
  });
};
