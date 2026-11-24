import type { LessonState, ModeProgress } from "./types";
import type { StudyMode } from "./savedLessons";

/**
 * Chế độ nên luyện tiếp: chế độ làm ít hơn, bằng nhau thì nghe chép. Bài đã xong cả hai thì vẫn gợi ý chế độ làm ít hơn
 * để luyện lại.
 */
export function nextMode(progress: ModeProgress): StudyMode {
  return progress.shadowingPercent < progress.dictationPercent ? "shadowing" : "dictation";
}

/** Suy ra trạng thái học của một bài từ phần trăm hai chế độ. */
export function lessonStateOf(progress: ModeProgress): LessonState {
  if (progress.dictationPercent >= 100 && progress.shadowingPercent >= 100) return "done";
  if (progress.dictationPercent > 0 || progress.shadowingPercent > 0) return "doing";
  return "todo";
}

/** Đổi tổng thời lượng (giây) thành chuỗi gọn như "24 phút" hoặc "1 giờ 12 phút". */
export function formatTotalMinutes(totalSec: number, locale: string): string {
  const mins = Math.max(1, Math.round(totalSec / 60));
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (locale === "en") {
    if (hours === 0) return `${mins} min`;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  }
  if (hours === 0) return `${mins} phút`;
  return rem > 0 ? `${hours} giờ ${rem} phút` : `${hours} giờ`;
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
