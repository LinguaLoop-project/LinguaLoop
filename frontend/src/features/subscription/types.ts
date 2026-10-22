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
}

/** Mã tính năng có hạn mức (feature_code ở backend). */
export const FEATURE_SHADOWING = "shadowing_assess";
export const FEATURE_TUTOR = "tutor_session";
