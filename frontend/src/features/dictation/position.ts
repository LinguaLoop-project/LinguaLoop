/** Câu chứa mốc `ms`; mốc nằm trong khoảng lặng giữa hai câu thì lấy câu gần nhất (cùng quy tắc với Shadowing). */
export function sentenceAt(segments: readonly { startMs: number; endMs: number }[], ms: number): number {
  let best = 0;
  let bestGap = Number.POSITIVE_INFINITY;
  segments.forEach((s, i) => {
    const gap = ms < s.startMs ? s.startMs - ms : ms > s.endMs ? ms - s.endMs : 0;
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  });
  return best;
}

/**
 * Câu cần chuyển tới khi người học tự tua hoặc tự phát bằng thanh YouTube; null là giữ nguyên câu hiện tại.
 * `blocked` là lúc không được đổi câu, như khi ô gõ đang có chữ (đổi câu sẽ làm mất chữ đã gõ).
 */
export function followTarget(
  segments: readonly { startMs: number; endMs: number }[],
  ms: number,
  currentIndex: number,
  blocked: boolean,
): number | null {
  if (blocked || segments.length === 0) return null;
  const target = sentenceAt(segments, ms);
  return target === currentIndex ? null : target;
}
