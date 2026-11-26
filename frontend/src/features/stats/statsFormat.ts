import type { DailySeries, StatsPeriod } from "./types";

/** Hàm thuần cho các màn thống kê: định dạng số, mức tăng giảm, trục biểu đồ. */

/** Khoảng thời gian chọn được, mặc định 30 ngày (BR-NK-07). */
export const STATS_PERIODS: readonly StatsPeriod[] = ["D7", "D30", "D90"];
export const DEFAULT_STATS_PERIOD: StatsPeriod = "D30";

function locale(language: string): string {
  return language.startsWith("en") ? "en-GB" : "vi-VN";
}

export function formatInt(value: number | null, language: string): string {
  return value === null ? "—" : new Intl.NumberFormat(locale(language), { maximumFractionDigits: 0 }).format(value);
}

/** Số thập phân tối đa `digits` chữ số (điểm trung bình, phần trăm). */
export function formatDecimal(value: number | null, language: string, digits = 1): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat(locale(language), { maximumFractionDigits: digits }).format(value);
}

export function formatPct(value: number | null, language: string): string {
  return value === null ? "—" : `${formatDecimal(value, language, 1)}%`;
}

export function formatVnd(value: number | null, language: string): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat(locale(language), { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

/** Số gọn cho trục: 950, 1.200, 12K, 3,4M. Dưới 10.000 viết đầy đủ. */
export function formatAxis(value: number, language: string): string {
  if (Math.abs(value) < 10_000) return formatInt(value, language);
  return new Intl.NumberFormat(locale(language), { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/**
 * Ngày "2026-11-16" thành "16/11" (hoặc "16 Nov"), đọc thẳng từ chuỗi nên không lệch múi giờ; tự ghép chuỗi tiếng Việt
 * vì dấu phân cách của `vi-VN` khác nhau giữa các trình duyệt.
 */
export function formatDay(day: string, language: string): string {
  const [year, month, date] = day.split("-").map(Number);
  if (!language.startsWith("en")) return `${String(date).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export type Trend = "up" | "down" | "flat";

/** Hướng của mức tăng giảm; null khi kỳ trước bằng 0 hoặc không có. */
export function trendOf(changePct: number | null): Trend | null {
  if (changePct === null) return null;
  if (changePct > 0) return "up";
  if (changePct < 0) return "down";
  return "flat";
}

/** Không có số nào khác 0 ở mọi chuỗi: biểu đồ để trống kèm "Chưa có dữ liệu" (UC-NK-02 nhánh 3a). */
export function isEmptySeries(daily: DailySeries, names?: readonly string[]): boolean {
  const keys = names ?? Object.keys(daily.series);
  return keys.every((name) => (daily.series[name] ?? []).every((value) => value === 0));
}

/** Vạch chia trục tung tròn số: 0 và 3–5 vạch đều nhau phủ hết giá trị lớn nhất. */
export function niceTicks(max: number, target = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / target;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const niceStep = Number.isInteger(step) ? step : Math.ceil(step);
  const ticks: number[] = [];
  for (let value = 0; value < max + niceStep; value += niceStep) {
    ticks.push(value);
    if (value >= max) break;
  }
  return ticks;
}

/** Thứ tự cố định của 5 tính năng AI: quyết định màu trên biểu đồ, không đổi theo số liệu. */
export const AI_FEATURE_ORDER: readonly string[] = [
  "shadowing_feedback",
  "lesson_chat",
  "tutor_session",
  "lesson_suggest",
  "lesson_import",
];

/** Biến màu của một tính năng theo thứ tự cố định; tính năng lạ dùng màu cuối. */
export function featureColor(feature: string): string {
  const index = AI_FEATURE_ORDER.indexOf(feature);
  return `--chart-${index >= 0 ? index + 1 : AI_FEATURE_ORDER.length}`;
}

/**
 * Thứ tự dòng của bảng tính năng: tính năng có lần dùng trước, chi phí cao trước; tính năng chưa dùng xuống cuối theo
 * thứ tự cố định.
 */
export function sortFeaturesForTable<T extends { feature: string; uses: number; costVnd: number }>(features: readonly T[]): T[] {
  const fixed = (f: string) => (AI_FEATURE_ORDER.includes(f) ? AI_FEATURE_ORDER.indexOf(f) : AI_FEATURE_ORDER.length);
  return [...features].sort((a, b) => {
    const usedA = a.uses > 0 ? 0 : 1;
    const usedB = b.uses > 0 ? 0 : 1;
    if (usedA !== usedB) return usedA - usedB;
    if (usedA === 0 && a.costVnd !== b.costVnd) return b.costVnd - a.costVnd;
    return fixed(a.feature) - fixed(b.feature);
  });
}
