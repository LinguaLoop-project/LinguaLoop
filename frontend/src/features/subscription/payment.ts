import type { OrderKind, SalePlan } from "./types";

/** Lý do thất bại VNPAY có câu riêng; mã khác dùng câu chung kèm mã (UC-PR-03 3b). */
export const KNOWN_FAILURE_CODES = ["07", "09", "10", "11", "12", "13", "51", "65", "75", "79"] as const;

/** Khóa i18n `result.reason.*` cho mã phản hồi VNPAY. */
export function failureReasonKey(code: string | null): string {
  return code && (KNOWN_FAILURE_CODES as readonly string[]).includes(code) ? code : "other";
}

/**
 * Ngày hết hạn dự kiến (UC-PR-02 bước 3a, UC-PR-04 bước 3): nâng cấp tính từ hôm nay, gia hạn nối tiếp ngày hết hạn
 * hiện tại (BR-PR-06, BR-PR-07). Cộng tháng theo lịch: ngày 31 cộng 1 tháng vào tháng ngắn thì lùi về ngày cuối tháng.
 */
export function expectedEnd(kind: OrderKind, months: number, now: Date, currentEnd: string | null): Date {
  const base = kind === "renew" && currentEnd && Date.parse(currentEnd) > now.getTime() ? new Date(currentEnd) : now;
  return addMonths(base, months);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

/**
 * Phần trăm tiết kiệm so với mua lẻ gói 1 tháng rẻ nhất cùng số tháng; null khi không có gói 1 tháng để so, hoặc không
 * rẻ hơn.
 */
export function savingsPercent(plan: SalePlan, plans: SalePlan[]): number | null {
  const monthly = plans.filter((p) => p.months === 1).map((p) => p.priceVnd);
  if (plan.months <= 1 || monthly.length === 0) return null;
  const full = Math.min(...monthly) * plan.months;
  if (full <= 0) return null;
  const percent = Math.round((1 - plan.priceVnd / full) * 100);
  return percent > 0 ? percent : null;
}

/**
 * Giá quy đổi thấp nhất mỗi tháng (VND) trong danh sách gói đang mở bán; null khi chưa có gói nào. Gói 0 đồng (kích hoạt
 * ngay, không thanh toán) không tính vì không phải mức giá để quảng bá.
 */
export function lowestMonthlyPriceVnd(plans: SalePlan[]): number | null {
  const perMonth = plans
    .filter((p) => p.months > 0 && p.priceVnd > 0)
    .map((p) => Math.round(p.priceVnd / p.months));
  if (perMonth.length === 0) return null;
  return Math.min(...perMonth);
}

/** Tham số VNPAY trên Return URL (`vnp_*`), giữ nguyên để server kiểm chữ ký. */
export function vnpayParams(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  new URLSearchParams(search).forEach((value, key) => {
    if (key.startsWith("vnp_")) params[key] = value;
  });
  return params;
}

/** Trang học viên đang mở khi bấm nâng cấp, để quay lại sau khi thanh toán (AC-PR-07). */
const RETURN_TO_KEY = "lingualoop.pro.returnTo";

export function rememberReturnTo(path: string): void {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    // Trình duyệt chặn sessionStorage: chỉ mất nút quay lại
  }
}

/** Trang đã nhớ (không xóa); null khi không có hoặc không phải đường dẫn nội bộ. */
export function peekReturnTo(): string | null {
  try {
    const path = sessionStorage.getItem(RETURN_TO_KEY);
    return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}

export function clearReturnTo(): void {
  try {
    sessionStorage.removeItem(RETURN_TO_KEY);
  } catch {
    // Không xóa được thì lần sau vẫn hiện nút quay lại, không ảnh hưởng thanh toán
  }
}
