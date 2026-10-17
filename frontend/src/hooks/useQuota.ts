import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../features/auth/stores/authStore";
import { useMyPlan } from "../features/subscription/hooks/useMyPlan";
import { USAGE_QUERY_KEY, useFeatureUsage } from "../features/subscription/hooks/useUsage";
import { FEATURE_SHADOWING } from "../features/subscription/types";
import { useQuotaStore } from "../stores/quotaStore";

/** Số lượt Free dự phòng để hiển thị khi chưa tải được hạn mức từ server. */
export const MAX_FREE_ACTIONS = 5;

/**
 * Hạn mức hiển thị ở thanh trên và hộp nâng cấp. Số lượt do server đếm (`GET /me/usage`, tính năng
 * shadowing_assess); không còn bộ đếm cục bộ.
 */
export function useQuota() {
  const { user } = useAuthStore();
  const { showUpgradeModal, setShowUpgradeModal } = useQuotaStore();
  const { data: myPlan } = useMyPlan();
  const queryClient = useQueryClient();
  const shadowing = useFeatureUsage(FEATURE_SHADOWING);

  // Gói do server tính; chưa tải xong hoặc lỗi thì coi là 'free'
  const isPro = user?.role === "admin" || user?.role === "instructor" || myPlan?.plan === "pro";

  const actionsToday = shadowing?.used ?? 0;
  const maxActions = shadowing?.limit ?? MAX_FREE_ACTIONS;
  /** null: không giới hạn hoặc chưa biết. */
  const remaining = shadowing?.remaining ?? null;

  const checkQuota = useCallback((): boolean => {
    if (isPro || remaining === null || remaining > 0) return true;
    setShowUpgradeModal(true);
    return false;
  }, [isPro, remaining, setShowUpgradeModal]);

  /** Server đã tự đếm; chỉ cần đọc lại số liệu. */
  const incrementQuota = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: USAGE_QUERY_KEY });
  }, [queryClient]);

  return {
    actionsToday,
    maxActions,
    remaining,
    isPro,
    checkQuota,
    incrementQuota,
    showUpgradeModal,
    setShowUpgradeModal,
  };
}
