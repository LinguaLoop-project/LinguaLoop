import { create } from "zustand";
import { AI_ACTION_FEEDBACK, AI_ACTION_TUTOR } from "../features/subscription/types";

/** Vì sao mở hộp mời Pro: thiếu năng lượng AI (cho gia sư, cho nhận xét AI, hoặc chung) hay nội dung chỉ có ở Pro. */
export type UpgradeReason = "quota" | "tutor" | "ai_feedback" | "pro";

/** `details.action` của lỗi QUOTA_EXCEEDED cho biết hành động nào thiếu năng lượng; hộp mời Pro nói về hành động đó. */
export const upgradeReasonOf = (details: { action?: unknown } | undefined): UpgradeReason => {
  if (details?.action === AI_ACTION_TUTOR) return "tutor";
  if (details?.action === AI_ACTION_FEEDBACK) return "ai_feedback";
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
