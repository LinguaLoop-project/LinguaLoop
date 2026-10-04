import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../features/auth/stores/authStore";
import { useQuotaStore } from "../stores/quotaStore";

const MAX_FREE_ACTIONS = 5;

export function useQuota() {
  const { user } = useAuthStore();
  const { showUpgradeModal, setShowUpgradeModal } = useQuotaStore();
  const [actionsToday, setActionsToday] = useState(0);

  // Consider users with missing plan as 'free'
  // Actually, let's treat admin and instructor as pro automatically.
  const isPro = 
    user?.role === "admin" || 
    user?.role === "instructor" || 
    (user as any)?.plan === "pro";

  useEffect(() => {
    if (!user) return;
    const key = `quota_${user.id}`;
    const stored = localStorage.getItem(key);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          setActionsToday(parsed.count);
        } else {
          // Reset for new day
          localStorage.setItem(key, JSON.stringify({ date: today, count: 0 }));
          setActionsToday(0);
        }
      } catch {
        localStorage.setItem(key, JSON.stringify({ date: today, count: 0 }));
        setActionsToday(0);
      }
    } else {
      localStorage.setItem(key, JSON.stringify({ date: today, count: 0 }));
      setActionsToday(0);
    }
  }, [user]);

  const checkQuota = useCallback((): boolean => {
    if (isPro) return true;
    if (actionsToday < MAX_FREE_ACTIONS) return true;
    
    setShowUpgradeModal(true);
    return false;
  }, [isPro, actionsToday]);

  const incrementQuota = useCallback(() => {
    if (isPro) return;
    
    const newCount = actionsToday + 1;
    setActionsToday(newCount);
    
    if (user) {
      const key = `quota_${user.id}`;
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(key, JSON.stringify({ date: today, count: newCount }));
    }
  }, [actionsToday, isPro, user]);

  return {
    actionsToday,
    maxActions: MAX_FREE_ACTIONS,
    isPro,
    checkQuota,
    incrementQuota,
    showUpgradeModal,
    setShowUpgradeModal
  };
}
