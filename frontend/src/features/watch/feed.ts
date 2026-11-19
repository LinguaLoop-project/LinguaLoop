import type { WatchItem, WatchLine } from "./types";

/** Một ô trong luồng: video hoặc thẻ mời nâng cấp Pro. */
export type FeedEntry = { kind: "video"; key: string; item: WatchItem } | { kind: "upsell"; key: string };

/** Cứ sau bấy nhiêu video thì chèn một thẻ mời nâng cấp cho học viên gói Free (AC-TC-32). */
export const UPSELL_EVERY = 10;

/** Ghép video với thẻ mời nâng cấp: chỉ chèn khi đang có video Pro bị ẩn, sau mỗi `every` video. */
export function buildEntries(items: readonly WatchItem[], proHidden: boolean, every = UPSELL_EVERY): FeedEntry[] {
  const entries: FeedEntry[] = [];
  items.forEach((item, index) => {
    entries.push({ kind: "video", key: item.lessonId, item });
    if (proHidden && (index + 1) % every === 0) entries.push({ kind: "upsell", key: `upsell-${index + 1}` });
  });
  return entries;
}

/**
 * Câu đang nói ở mốc `ms`: câu cuối cùng đã bắt đầu, nên trong khoảng lặng giữa hai câu vẫn là câu vừa nói xong. Trước câu
 * đầu thì trả -1. `lines` đã theo thứ tự thời gian.
 */
export function activeLineIndex(lines: readonly WatchLine[], ms: number): number {
  let found = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startMs <= ms) found = i;
    else break;
  }
  return found;
}

/**
 * Mốc kết thúc ước lượng của từng từ trong câu, tính từ đầu câu (mili giây). Dữ liệu chỉ có mốc của câu nên chia thời
 * lượng câu theo độ dài từ (số ký tự cộng một khoảng nghỉ ngắn).
 */
export function estimateWordEnds(words: readonly string[], durationMs: number): number[] {
  const weights = words.map((word) => Math.max(word.length, 1) + 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0 || durationMs <= 0) return words.map(() => 0);
  let acc = 0;
  return weights.map((weight) => {
    acc += weight;
    return Math.round((acc / total) * durationMs);
  });
}

/** Từ đang nói ở mốc `ms` (ước lượng); -1 khi `ms` ngoài thời gian của câu. */
export function activeWordIndex(words: readonly string[], line: Pick<WatchLine, "startMs" | "endMs">, ms: number): number {
  if (ms < line.startMs || ms >= line.endMs || words.length === 0) return -1;
  const ends = estimateWordEnds(words, line.endMs - line.startMs);
  const offset = ms - line.startMs;
  const index = ends.findIndex((end) => offset < end);
  return index === -1 ? words.length - 1 : index;
}

/** Seed của một phiên xem: giữ thứ tự luồng cố định khi tải thêm trang. */
export function newSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}
