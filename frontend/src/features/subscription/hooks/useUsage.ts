import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { subscriptionService } from "../services/subscriptionService";
import type { FeatureUsage } from "../types";

export const USAGE_QUERY_KEY = ["subscription", "usage"] as const;

/** Hạn mức đã dùng trong ngày của mọi tính năng, do server đếm (`GET /me/usage`). */
export const useUsage = () => {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  return useQuery({
    queryKey: USAGE_QUERY_KEY,
    queryFn: () => subscriptionService.getUsage(),
    enabled: hasToken,
    staleTime: 30_000,
  });
};

export const useFeatureUsage = (feature: string): FeatureUsage | undefined => {
  const { data } = useUsage();
  return data?.features.find((f) => f.feature === feature);
};
