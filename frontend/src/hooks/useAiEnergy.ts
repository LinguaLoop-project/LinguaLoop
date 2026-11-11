import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../features/auth/stores/authStore";
import { useMyPlan } from "../features/subscription/hooks/useMyPlan";
import { CREDIT_QUERY_KEY, useCreditBalance } from "../features/subscription/hooks/useCredit";
import { AI_ACTION_TUTOR, TUTOR_SESSION_COST } from "../features/subscription/types";
import { deriveEnergy } from "./aiEnergyMath";

export { DEFAULT_FREE_AI_ENERGY } from "./aiEnergyMath";

/**
 * Ví credit AI dùng chung (ADR 0011): số dư do server trả ở `GET /credits/balance`. Nhận xét AI trừ theo token, phiên
 * gia sư trừ cố định; luyện shadowing không tốn credit nên không có ở đây.
 */
export function useAiEnergy() {
  const { user } = useAuthStore();
  const { data: myPlan } = useMyPlan();
  const { data: credit } = useCreditBalance();
  const queryClient = useQueryClient();

  // Gói do server tính; chưa tải xong hoặc lỗi thì coi là 'free'
  const isPro =
    user?.role === "admin" ||
    user?.role === "teacher" ||
    credit?.kind === "pro" ||
    credit?.kind === "staff" ||
    myPlan?.plan === "pro";

  /** Giá cố định đã biết; nhận xét AI tính theo token nên không có giá cố định. */
  const costs: Record<string, number> = { [AI_ACTION_TUTOR]: TUTOR_SESSION_COST };

  /** Server đã tự trừ; chỉ cần đọc lại số dư. */
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CREDIT_QUERY_KEY });
  }, [queryClient]);

  return { isPro, ...deriveEnergy(isPro, credit), costs, refresh };
}
