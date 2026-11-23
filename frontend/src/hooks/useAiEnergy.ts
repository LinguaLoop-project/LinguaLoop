import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../features/auth/stores/authStore";
import { useMyPlan } from "../features/subscription/hooks/useMyPlan";
import { CREDIT_QUERY_KEY, useCreditBalance, useCreditPrices } from "../features/subscription/hooks/useCredit";
import { AI_ACTION_TUTOR, type AiAction } from "../features/subscription/types";
import { deriveEnergy } from "./aiEnergyMath";

/**
 * Ví credit AI dùng chung (ADR 0011, ADR 0013): số dư do server trả ở `GET /credits/balance`, giá mỗi tính năng ở
 * `GET /credits/prices`. Mỗi tính năng trừ cố định theo đơn vị; luyện shadowing không tốn credit nên không có ở đây.
 */
export function useAiEnergy() {
  const { user } = useAuthStore();
  const { data: myPlan } = useMyPlan();
  const { data: credit } = useCreditBalance();
  const { data: prices } = useCreditPrices();
  const queryClient = useQueryClient();

  // Gói do server tính; chưa tải xong hoặc lỗi thì coi là 'free'
  const isPro =
    user?.role === "admin" ||
    user?.role === "teacher" ||
    credit?.kind === "pro" ||
    credit?.kind === "staff" ||
    myPlan?.plan === "pro";

  /** Credit mỗi đơn vị của tính năng; undefined khi chưa tải xong giá (giao diện ẩn giá thay vì hiện số sai). */
  const priceOf = useCallback((action: AiAction): number | undefined => prices?.[action], [prices]);

  /** Server đã tự trừ; chỉ cần đọc lại số dư. */
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CREDIT_QUERY_KEY });
  }, [queryClient]);

  return { isPro, ...deriveEnergy(credit, prices?.[AI_ACTION_TUTOR]), priceOf, refresh };
}
