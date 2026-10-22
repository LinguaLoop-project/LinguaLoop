import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../features/auth/stores/authStore";
import { useMyPlan } from "../features/subscription/hooks/useMyPlan";
import { USAGE_QUERY_KEY, useFeatureUsage, useUsage } from "../features/subscription/hooks/useUsage";
import { FEATURE_AI_ENERGY } from "../features/subscription/types";
import { deriveEnergy } from "./aiEnergyMath";

export { DEFAULT_FREE_AI_ENERGY } from "./aiEnergyMath";

/**
 * Bể năng lượng AI dùng chung (`ai_energy`, BR-QUOTA-01, ADR 0006). Mức dùng và bảng giá từng hoạt động
 * (`costs`) do server trả ở `GET /me/usage`; luyện shadowing không tốn năng lượng nên không có ở đây.
 */
export function useAiEnergy() {
  const { user } = useAuthStore();
  const { data: myPlan } = useMyPlan();
  const { data: usageData } = useUsage();
  const queryClient = useQueryClient();
  const energy = useFeatureUsage(FEATURE_AI_ENERGY);

  // Gói do server tính; chưa tải xong hoặc lỗi thì coi là 'free'
  const isPro = user?.role === "admin" || user?.role === "instructor" || myPlan?.plan === "pro";

  /** Giá từng hoạt động; rỗng cho tới khi tải xong. */
  const costs: Record<string, number> = usageData?.costs ?? {};

  /** Server đã tự trừ; chỉ cần đọc lại số liệu. */
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: USAGE_QUERY_KEY });
  }, [queryClient]);

  return { isPro, ...deriveEnergy(isPro, energy, costs), costs, refresh };
}
