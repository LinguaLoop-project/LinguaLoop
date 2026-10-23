import type { DictationSentence } from "./types";

/**
 * Đích của đường dẫn `?sentence=<id>&redo=1` (từ trang Câu cần ôn và Ghi chú): chỉ số câu cần mở và có mở ở chế độ
 * làm lại không. Id không có trong bài thì bỏ qua để bài mở như bình thường.
 */
export function deepLinkTarget(
  sentences: DictationSentence[],
  params: URLSearchParams,
): { index: number; redo: boolean } | null {
  const id = params.get("sentence");
  const index = id ? sentences.findIndex((s) => s.id === id) : -1;
  if (index < 0) return null;
  return { index, redo: params.get("redo") === "1" && sentences[index].latest !== null };
}
