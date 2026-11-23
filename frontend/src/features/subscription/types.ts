export type PlanCode = "free" | "pro";

export interface PlanResponse {
  plan: PlanCode;
}

/**
 * Ví credit AI (`GET /credits/balance`). `kind`: `free` là credit dùng thử tặng một lần, không làm mới; `pro` làm mới theo
 * tháng của gói, `staff` (giáo viên, quản trị viên) không tự làm mới. `resetsAt` trống với `staff`.
 */
export interface CreditBalance {
  balance: number;
  resetsAt: string | null;
  kind: "free" | "pro" | "staff";
}

/** Mã tính năng AI tính credit: khoá `details.feature` trong lỗi QUOTA_EXCEEDED (khớp `AiFeature` ở backend). */
export const AI_ACTION_FEEDBACK = "shadowing_feedback";
export const AI_ACTION_TUTOR = "tutor_session";
export const AI_ACTION_LESSON_CHAT = "lesson_chat";
export const AI_ACTION_LESSON_SUGGEST = "lesson_suggest";
export const AI_ACTION_LESSON_IMPORT = "lesson_import";

export type AiAction =
  | typeof AI_ACTION_FEEDBACK
  | typeof AI_ACTION_TUTOR
  | typeof AI_ACTION_LESSON_CHAT
  | typeof AI_ACTION_LESSON_SUGGEST
  | typeof AI_ACTION_LESSON_IMPORT;

/**
 * Credit trừ cho mỗi đơn vị của từng tính năng (`GET /credits/prices`, BR-GA-04, BR-GA-06): nhận xét AI mỗi lần, phiên
 * gia sư mỗi phiên, thực hành với AI mỗi cuộc trò chuyện, gợi ý dịch mỗi câu, tạo bài từ YouTube mỗi bài.
 */
export type CreditPrices = Partial<Record<AiAction, number>>;

/** Credit dùng thử mặc định (`ai_settings.trial_credits`), chỉ dùng cho công cụ thử để đặt lại ví. */
export const DEFAULT_TRIAL_CREDITS = 100;
