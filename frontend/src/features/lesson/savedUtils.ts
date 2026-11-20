import type { ModeProgress } from "./types";
import type { StudyMode } from "./savedLessons";

/**
 * Chế độ nên luyện tiếp: chế độ làm ít hơn, bằng nhau thì nghe chép. Bài đã xong cả hai thì vẫn gợi ý chế độ làm ít hơn
 * để luyện lại.
 */
export function nextMode(progress: ModeProgress): StudyMode {
  return progress.shadowingPercent < progress.dictationPercent ? "shadowing" : "dictation";
}

/** Đổi `savedAt` thành "3 ngày trước"; dưới một phút là "vừa xong". */
export function savedAgo(savedAt: string, now: Date, locale: string): string {
  const seconds = Math.round((new Date(savedAt).getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(0, "second");
}
