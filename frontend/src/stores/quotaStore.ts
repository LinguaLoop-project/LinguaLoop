import { create } from "zustand";

/** Vì sao mở hộp mời Pro: hết lượt hành động chung, hay hết phiên gia sư hôm nay. */
export type UpgradeReason = "quota" | "tutor";

/** Mã tính năng gia sư trong `details.feature` của lỗi QUOTA_EXCEEDED. */
const TUTOR_FEATURE = "tutor_session";

/** Lỗi QUOTA_EXCEEDED của tính năng nào thì hộp mời Pro nói về tính năng đó. */
export const upgradeReasonOf = (details: { feature?: unknown } | undefined): UpgradeReason =>
  details?.feature === TUTOR_FEATURE ? "tutor" : "quota";

interface QuotaState {
  showUpgradeModal: boolean;
  upgradeReason: UpgradeReason;
  setShowUpgradeModal: (show: boolean, reason?: UpgradeReason) => void;
  // actionsToday can also be managed here, but we will manage it inside the hook
}

export const useQuotaStore = create<QuotaState>((set) => ({
  showUpgradeModal: false,
  upgradeReason: "quota",
  setShowUpgradeModal: (show, reason = "quota") => set({ showUpgradeModal: show, upgradeReason: reason }),
}));
