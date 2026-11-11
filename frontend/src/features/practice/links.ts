/**
 * Đường dẫn mở bài nghe chép tại một câu. `redo` mở câu ở chế độ làm lại: lượt nộp sau đó là lượt làm lại và không
 * vào thống kê điểm yếu (BR-DICT-07).
 */
export function practiceUrl(lessonId: string, sentenceId: string, options: { redo?: boolean } = {}): string {
  const params = new URLSearchParams({ sentence: sentenceId });
  if (options.redo) params.set("redo", "1");
  return `/student/dictation/${encodeURIComponent(lessonId)}?${params.toString()}`;
}

/** Đường dẫn mở trang Shadowing của bài tại một câu (luyện lại: số lượt đọc không giới hạn nên không có chế độ làm lại). */
export function shadowingUrl(lessonId: string, sentenceId: string): string {
  return `/student/shadowing/${encodeURIComponent(lessonId)}?${new URLSearchParams({ sentence: sentenceId }).toString()}`;
}

/** Đường dẫn mở một câu ở đúng chế độ của ghi chú hoặc dòng đang xem (nghe chép hoặc Shadowing). */
export function modeUrl(mode: "dictation" | "shadowing", lessonId: string, sentenceId: string): string {
  return mode === "shadowing" ? shadowingUrl(lessonId, sentenceId) : practiceUrl(lessonId, sentenceId);
}
