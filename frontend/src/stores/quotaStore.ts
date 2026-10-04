import { create } from "zustand";

interface QuotaState {
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  // actionsToday can also be managed here, but we will manage it inside the hook
}

export const useQuotaStore = create<QuotaState>((set) => ({
  showUpgradeModal: false,
  setShowUpgradeModal: (show) => set({ showUpgradeModal: show }),
}));
