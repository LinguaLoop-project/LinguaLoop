import type { MeResponse } from "@/features/auth";
import type { LearningProfilePayload } from "./api";

/**
 * API hồ sơ học tập nhận đủ các trường mỗi lần lưu (UC-TK-08). Mỗi phần của Cài đặt chỉ đổi một vài trường nên phần còn lại
 * lấy từ hồ sơ đang lưu; `acceptTerms` giữ nguyên trạng thái đã đồng ý.
 */
export function profilePayload(user: MeResponse, changes: Partial<LearningProfilePayload>): LearningProfilePayload {
  return {
    displayName: user.displayName?.trim() || "",
    dailyMinutes: user.dailyMinutes ?? 15,
    uiLanguage: user.uiLanguage === "en" ? "en" : "vi",
    timezone: user.timezone,
    acceptTerms: Boolean(user.termsAccepted),
    ...changes,
  };
}
