/** Kiểu dữ liệu của các màn thống kê quản trị (UC-NK-02 đến 04), khớp DTO của backend. Số tiền tính bằng đồng. */

export type StatsPeriod = "D7" | "D30" | "D90";

/** Gói của học viên tại thời điểm luyện (BR-NK-12). */
export type PlanFilter = "ALL" | "FREE" | "PRO";

/** Một chỉ số kèm kỳ liền trước và mức tăng giảm %; null khi không tính được (BR-NK-07). */
export interface Metric {
  current: number | null;
  previous: number | null;
  changePct: number | null;
}

/** Số liệu theo ngày: đủ mọi ngày của khoảng (ngày trống là 0), mỗi chuỗi cùng độ dài với `days`. */
export interface DailySeries {
  days: string[];
  series: Record<string, number[]>;
}

export interface Accounts {
  total: number;
  students: number;
  teachers: number;
  admins: number;
  emailVerified: number;
  activePro: number;
  proRatioPct: number | null;
}

export interface PendingReport {
  reportId: string;
  content: string | null;
  reason: string;
  reporterName: string | null;
  createdAt: string;
}

export interface OverviewStats {
  computedAt: string;
  period: StatsPeriod;
  accounts: Accounts;
  newAccounts: Metric;
  recognizedRevenueVnd: number;
  publishedLessons: number;
  publishedDecks: number;
  pendingAdminReports: number;
  oldestPendingReports: PendingReport[];
  daily: DailySeries;
}

export interface RankedItem {
  id: string;
  name: string;
  ownerName: string | null;
  value: number;
}

export interface PracticeStats {
  computedAt: string;
  period: StatsPeriod;
  plan: PlanFilter;
  learners: Metric;
  dictationAttempts: Metric;
  shadowingAttempts: Metric;
  reviews: Metric;
  lessonsCompleted: Metric;
  dictationAvgScore: Metric;
  shadowingAvgScore: Metric;
  correctRatePct: Metric;
  daily: DailySeries;
  topLessons: RankedItem[];
  topDecks: RankedItem[];
}

/** Lãi lỗ của một tính năng tính credit (BR-NK-09). */
export interface FeatureUsage {
  feature: string;
  /** Lượt gọi thành công. */
  uses: number;
  /** Số đơn vị tính credit của các lượt đó (câu, phiên, bài...), cùng đơn vị với bảng dịch vụ tính credit. */
  units: number;
  credits: number;
  costVnd: number;
  /** Giá bán bình quân mỗi đơn vị = credit đã tiêu ÷ số đơn vị × giá trị 1 credit; null khi chưa có lần dùng. */
  pricePerUnitVnd: number | null;
  /** Chi phí bình quân mỗi đơn vị = chi phí thực tế ÷ số đơn vị; null khi chưa có lần dùng. */
  costPerUnitVnd: number | null;
  /** Dấu "Lỗ": chi phí bình quân mỗi đơn vị lớn hơn giá bán, không phụ thuộc ai dùng. */
  loss: boolean;
}

export interface AiTotals {
  netRevenueVnd: number;
  costVnd: number;
  /** Chi phí của học viên Free (dùng thử) và tỷ lệ trên tổng chi phí; tỷ lệ null khi chi phí bằng 0 (BR-NK-14). */
  trialCostVnd: number;
  trialCostPct: number | null;
  grossProfitVnd: number;
  grossMarginPct: number | null;
}

export interface TopAccount {
  userId: string;
  name: string;
  email: string;
  /** Gói hiện tại: pro, free, teacher hoặc admin. */
  plan: string | null;
  credits: number;
  costVnd: number;
}

export interface AiUsageStats {
  computedAt: string;
  period: StatsPeriod;
  creditValueVnd: number;
  features: FeatureUsage[];
  totals: AiTotals;
  creditsByFeature: DailySeries;
  topAccounts: TopAccount[];
}
