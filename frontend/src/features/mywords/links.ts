/**
 * Đường dẫn mở bài nghe chép tại một câu. `redo` mở câu ở chế độ làm lại: lượt nộp sau đó là lượt làm lại và không
 * vào thống kê điểm yếu (BR-DICT-07).
 */
export function practiceUrl(lessonSlug: string, sentenceId: string, options: { redo?: boolean } = {}): string {
  const params = new URLSearchParams({ sentence: sentenceId });
  if (options.redo) params.set("redo", "1");
  return `/student/dictation/${encodeURIComponent(lessonSlug)}?${params.toString()}`;
}
