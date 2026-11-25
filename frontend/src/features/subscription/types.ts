export type PlanCode = "free" | "pro";

/** Gói hiện tại (`GET /subscriptions/me`); với Pro, `startsAt`/`endsAt` là khoảng Pro liên tục gồm cả các kỳ gia hạn. */
export interface PlanResponse {
  plan: PlanCode;
  startsAt: string | null;
  endsAt: string | null;
}

/** Một gói Pro đang bán (`SalePlanView`, BR-PR-11). */
export interface SalePlan {
  id: string;
  name: string;
  months: number;
  priceVnd: number;
  creditsPerMonth: number;
}

/** Loại đơn (BR-PR-05): nâng cấp từ Free hoặc gia hạn nối tiếp. */
export type OrderKind = "upgrade" | "renew";

export type OrderStatus = "pending" | "paid" | "canceled" | "failed" | "expired";

/** Một đơn đăng ký (`OrderView`); thông tin gói lưu cố định lúc tạo. `responseCode` là mã phản hồi VNPAY. */
export interface ProOrder {
  id: string;
  planId: string | null;
  planName: string;
  months: number;
  creditsPerMonth: number;
  amountVnd: number;
  kind: OrderKind;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  transactionNo: string | null;
  bankCode: string | null;
  payDate: string | null;
  responseCode: string | null;
}

/** Đơn vừa tạo và đường dẫn sang VNPAY; `paymentUrl` null khi gói 0 đồng đã được ghi nhận ngay. */
export interface Checkout {
  order: ProOrder;
  paymentUrl: string | null;
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
