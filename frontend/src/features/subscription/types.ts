export type PlanCode = "free" | "pro";

export interface PlanResponse {
  plan: PlanCode;
}

/** Mức dùng một tính năng trong chu kỳ hiện tại; `limit` và `remaining` là null khi không giới hạn. */
export interface FeatureUsage {
  feature: string;
  period: "day" | "month" | "none";
  limit: number | null;
  used: number;
  remaining: number | null;
}

export interface UsageResponse {
  features: FeatureUsage[];
  costs?: Record<string, number>;
}

/** Mã tính năng có hạn mức (feature_code ở backend). */
export const FEATURE_AI_ENERGY = "ai_energy";

/** Mã hoạt động tốn năng lượng AI: khoá của `costs` và của `details.action` trong lỗi QUOTA_EXCEEDED. */
export const AI_ACTION_FEEDBACK = "ai_feedback";
export const AI_ACTION_TUTOR = "tutor_session";
