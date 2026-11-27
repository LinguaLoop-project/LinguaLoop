import type { DailyMinutes } from "@/features/auth";

/** Định mức của một phiên Luyện tập hằng ngày theo mục tiêu ngày (BR-HT-24): số thẻ và tổng số câu (chia đều hai chế độ). */
export const DAILY_QUOTA: Record<DailyMinutes, { cards: number; sentences: number }> = {
  10: { cards: 15, sentences: 2 },
  15: { cards: 20, sentences: 4 },
  20: { cards: 30, sentences: 4 },
  30: { cards: 40, sentences: 6 },
};

/** Định mức của một mức bất kỳ; mức lạ rơi về mặc định 15 phút, giống backend. */
export function quotaFor(minutes: number): { cards: number; sentences: number } {
  return DAILY_QUOTA[minutes as DailyMinutes] ?? DAILY_QUOTA[15];
}
