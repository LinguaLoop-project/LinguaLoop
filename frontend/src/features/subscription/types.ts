export type PlanCode = "free" | "pro";

export interface PlanResponse {
  plan: PlanCode;
}

/**
 * Ví credit AI (`GET /credits/balance`). `kind`: `free` làm mới mỗi ngày lúc 00:00 giờ Việt Nam, `pro` làm mới theo tháng
 * của gói, `staff` (giáo viên, quản trị viên) không tự làm mới. `resetsAt` trống với `staff`.
 */
export interface CreditBalance {
  balance: number;
  resetsAt: string | null;
  kind: "free" | "pro" | "staff";
}

/** Mã tính năng AI tính credit: khoá `details.feature` trong lỗi QUOTA_EXCEEDED (khớp `AiFeature` ở backend). */
export const AI_ACTION_FEEDBACK = "shadowing_feedback";
export const AI_ACTION_TUTOR = "tutor_session";

/** Credit Free mỗi ngày (`ai_settings.free_daily_credits`), để hiển thị hạn mức vì server chỉ trả số dư. */
export const FREE_DAILY_CREDITS = 20;
/** Số dư tối thiểu để bắt đầu một tính năng AI (`ai_settings.min_balance_to_start`). */
export const CREDIT_MIN_TO_START = 5;
/** Giá cố định một phiên gia sư (`app.credit.tutor-session-cost`). */
export const TUTOR_SESSION_COST = 3;
