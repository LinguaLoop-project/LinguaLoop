import { beforeEach, describe, expect, it } from "vitest";
import { upgradeReasonOf, useQuotaStore } from "./quotaStore";

describe("upgradeReasonOf", () => {
  it("lỗi hết lượt của gia sư thì nói về gia sư, nhận xét AI thì nói về nhận xét AI, còn lại là hết lượt chung", () => {
    expect(upgradeReasonOf({ action: "tutor_session" })).toBe("tutor");
    expect(upgradeReasonOf({ action: "ai_feedback" })).toBe("ai_feedback");
    expect(upgradeReasonOf({ feature: "ai_energy" } as { action?: unknown })).toBe("quota");
    expect(upgradeReasonOf({})).toBe("quota");
    expect(upgradeReasonOf(undefined)).toBe("quota");
  });
});

describe("useQuotaStore", () => {
  beforeEach(() => useQuotaStore.getState().setShowUpgradeModal(false));

  it("mở hộp mời Pro với lý do, mặc định là hết lượt chung, và đóng thì về mặc định", () => {
    const { setShowUpgradeModal } = useQuotaStore.getState();

    setShowUpgradeModal(true);
    expect(useQuotaStore.getState()).toMatchObject({ showUpgradeModal: true, upgradeReason: "quota" });

    setShowUpgradeModal(true, "tutor");
    expect(useQuotaStore.getState().upgradeReason).toBe("tutor");

    setShowUpgradeModal(false);
    expect(useQuotaStore.getState()).toMatchObject({ showUpgradeModal: false, upgradeReason: "quota" });
  });
});
