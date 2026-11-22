/** Thông số quy đổi cần để tính biên của gói Pro (BR-GA-02). */
export interface MarginSettings {
  creditValueVnd: number;
  gatewayFeePct: number;
  marginPct: number;
}

export interface PlanNumbers {
  months: number;
  priceVnd: number;
  creditsPerMonth: number;
}

export type PlanMargin =
  /** Gói 0 đồng: không tính biên, chỉ nêu chi phí tối đa mỗi học viên mỗi tháng (BR-GA-05). */
  | { kind: "free"; maxCostVnd: number }
  /** Biên khi dùng hết credit (%) làm tròn 0,1; `low` khi thấp hơn biên lợi nhuận tối thiểu. */
  | { kind: "margin"; pct: number; low: boolean };

/**
 * Biên khi dùng hết credit của gói (BR-GA-05):
 * 1 − (credit mỗi tháng × giá trị 1 credit) ÷ (giá gói ÷ số tháng × (1 − phí cổng)), làm tròn tới 0,1%.
 * Ví dụ 1 credit = 25 đồng, phí 3%, 1.000 credit/tháng, gói 1 tháng 50.000 đồng: 48,5%.
 */
export function planMargin(plan: PlanNumbers, settings: MarginSettings): PlanMargin {
  const monthlyCost = plan.creditsPerMonth * settings.creditValueVnd;
  if (plan.priceVnd === 0) return { kind: "free", maxCostVnd: monthlyCost };
  const monthlyRevenue = (plan.priceVnd / plan.months) * (1 - settings.gatewayFeePct / 100);
  const pct = Math.round((1 - monthlyCost / monthlyRevenue) * 1000) / 10;
  return { kind: "margin", pct, low: pct < settings.marginPct };
}

/** Số nguyên trong [min, max] từ chuỗi người dùng nhập; null khi trống, sai kiểu hoặc ngoài khoảng. */
export function parseIntIn(raw: string, min: number, max: number): number | null {
  const text = raw.trim();
  if (!/^-?\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= min && value <= max ? value : null;
}

/** Phần trăm từ 0 đến 99, tối đa 1 chữ số thập phân, nhận cả dấu phẩy (BR-GA-02). */
export function parsePercent(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d)?$/.test(text)) return null;
  const value = Number(text);
  return value <= 99 ? value : null;
}
