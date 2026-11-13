import { create } from "zustand";
import { AI_ACTION_FEEDBACK, AI_ACTION_TUTOR } from "../features/subscription/types";

/** Vì sao mở hộp mời Pro: thiếu năng lượng AI (cho gia sư, cho nhận xét AI, hoặc chung) hay nội dung chỉ có ở Pro. */
export type UpgradeReason = "quota" | "tutor" | "ai_feedback" | "pro";

/** `details.feature` của lỗi QUOTA_EXCEEDED cho biết tính năng nào thiếu credit; hộp mời Pro nói về tính năng đó. */
export const upgradeReasonOf = (details: { feature?: unknown } | undefined): UpgradeReason => {
  if (details?.feature === AI_ACTION_TUTOR) return "tutor";
  if (details?.feature === AI_ACTION_FEEDBACK) return "ai_feedback";
  return "quota";
};

interface QuotaState {
  showUpgradeModal: boolean;
  upgradeReason: UpgradeReason;
  setShowUpgradeModal: (show: boolean, reason?: UpgradeReason) => void;
}

export const useQuotaStore = create<QuotaState>((set) => ({
  showUpgradeModal: false,
  upgradeReason: "quota",
  setShowUpgradeModal: (show, reason = "quota") => set({ showUpgradeModal: show, upgradeReason: reason }),
}));
