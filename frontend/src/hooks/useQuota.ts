import { useState, useCallback } from "react";
import { useAuthStore } from "../features/auth/stores/authStore";
import { useQuotaStore } from "../stores/quotaStore";

export const MAX_FREE_ACTIONS = 5;

function getStoredCount(userId?: string): number {
  if (!userId) return 0;
  const key = `quota_${userId}`;
  const stored = localStorage.getItem(key);
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        return parsed.count;
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  localStorage.setItem(key, JSON.stringify({ date: today, count: 0 }));
  return 0;
}

export function useQuota() {
  const { user } = useAuthStore();
  const { showUpgradeModal, setShowUpgradeModal } = useQuotaStore();

  const [actionsToday, setActionsToday] = useState(() =>
    getStoredCount(user?.id),
  );
  const [prevUserId, setPrevUserId] = useState(user?.id);

  // Sync state when user changes (React recommended pattern to avoid useEffect cascading renders)
  if (user?.id !== prevUserId) {
    setPrevUserId(user?.id);
    setActionsToday(getStoredCount(user?.id));
  }

  // Consider users with missing plan as 'free'
  const isPro =
    user?.role === "admin" ||
    user?.role === "instructor" ||
    (user as Record<string, unknown>)?.plan === "pro";

  const checkQuota = useCallback((): boolean => {
    if (isPro) return true;
    if (actionsToday < MAX_FREE_ACTIONS) return true;

    setShowUpgradeModal(true);
    return false;
  }, [isPro, actionsToday, setShowUpgradeModal]);

  const incrementQuota = useCallback(() => {
    if (isPro) return;

    const newCount = actionsToday + 1;
    setActionsToday(newCount);

    if (user) {
      const key = `quota_${user.id}`;
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(
        key,
        JSON.stringify({ date: today, count: newCount }),
      );
    }
  }, [actionsToday, isPro, user]);

  return {
    actionsToday,
    maxActions: MAX_FREE_ACTIONS,
    isPro,
    checkQuota,
    incrementQuota,
    showUpgradeModal,
    setShowUpgradeModal,
  };
}
