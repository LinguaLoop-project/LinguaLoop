import { describe, expect, it } from "vitest";
import type { MeResponse } from "@/features/auth";
import { profilePayload } from "./profilePayload";

const user = {
  displayName: "  Lan Nguyen ",
  dailyMinutes: 20,
  uiLanguage: "en",
  timezone: "Asia/Ho_Chi_Minh",
  termsAccepted: true,
} as MeResponse;

describe("profilePayload (tab Tài khoản và Giao diện của Cài đặt, UC-TK-10)", () => {
  it("giữ nguyên các trường không đổi từ hồ sơ đang lưu", () => {
    expect(profilePayload(user, {})).toEqual({
      displayName: "Lan Nguyen",
      dailyMinutes: 20,
      uiLanguage: "en",
      timezone: "Asia/Ho_Chi_Minh",
      acceptTerms: true,
    });
  });

  it("chỉ ghi đè trường được đổi", () => {
    expect(profilePayload(user, { displayName: "Lan" }).dailyMinutes).toBe(20);
    expect(profilePayload(user, { displayName: "Lan" }).displayName).toBe("Lan");
    expect(profilePayload(user, { uiLanguage: "vi" }).uiLanguage).toBe("vi");
    expect(profilePayload(user, { uiLanguage: "vi" }).displayName).toBe("Lan Nguyen");
  });

  it("hồ sơ chưa có tên hay mục tiêu thì dùng giá trị rỗng và 15 phút, chưa đồng ý điều khoản thì giữ false", () => {
    const fresh = { displayName: null, dailyMinutes: null, uiLanguage: "xx", timezone: "UTC", termsAccepted: false } as unknown as MeResponse;
    expect(profilePayload(fresh, {})).toEqual({
      displayName: "",
      dailyMinutes: 15,
      uiLanguage: "vi",
      timezone: "UTC",
      acceptTerms: false,
    });
  });
});
