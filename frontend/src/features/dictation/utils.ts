import { NETWORK_ERROR, toApiError } from "@/features/auth";
import type { AttemptResult, DictationLevel, DictationSentence, PromptToken } from "./types";

export type ScoreTone = "good" | "mid" | "bad";

/** Ngưỡng màu điểm của mockup: từ 80 là tốt, từ 60 là tạm, dưới đó là yếu. */
export const scoreTone = (score: number): ScoreTone => (score >= 80 ? "good" : score >= 60 ? "mid" : "bad");

/** Class viết nguyên văn để Tailwind nhận ra; màu lấy từ token. */
export const SCORE_TEXT: Record<ScoreTone, string> = {
  good: "text-success",
  mid: "text-warning",
  bad: "text-danger",
};

export const SCORE_BADGE: Record<ScoreTone, "success" | "warning" | "danger"> = {
  good: "success",
  mid: "warning",
  bad: "danger",
};

export const LEVEL_CHIP: Record<DictationLevel, string> = {
  easy: "border-[color-mix(in_srgb,var(--success)_45%,transparent)] text-success",
  normal: "border-[color-mix(in_srgb,var(--info)_45%,transparent)] text-info",
  hard: "border-[color-mix(in_srgb,var(--danger)_45%,transparent)] text-danger",
};

/**
 * Chỉ số câu cần làm đầu tiên sau `after` (quay vòng về đầu bài); -1 nếu hết. Câu cần làm là câu chưa có kết quả
 * hoặc câu đang được làm lại (`redo`).
 */
export function firstUndoneIndex(sentences: DictationSentence[], after: number, redo: ReadonlySet<string> = EMPTY): number {
  const todo = (s: DictationSentence) => !s.latest || redo.has(s.id);
  for (let i = after + 1; i < sentences.length; i++) if (todo(sentences[i])) return i;
  for (let i = 0; i <= Math.min(after, sentences.length - 1); i++) if (todo(sentences[i])) return i;
  return -1;
}

const EMPTY: ReadonlySet<string> = new Set();

/** Mức khó hơn kế tiếp; null khi đã là Hard. */
export const nextHarderLevel = (level: DictationLevel): DictationLevel | null =>
  level === "easy" ? "normal" : level === "normal" ? "hard" : null;

/** Các câu có điểm tính được: đã làm và không phải bỏ cuộc. */
const scored = (sentences: DictationSentence[]) => sentences.filter((s) => s.latest && !s.latest.gaveUp);

/** Điểm trung bình các câu đã làm (bỏ câu bỏ cuộc), làm tròn; null khi chưa có câu nào. */
export function averageScore(sentences: DictationSentence[]): number | null {
  const items = scored(sentences);
  if (items.length === 0) return null;
  return Math.round(items.reduce((sum, s) => sum + (s.latest?.score ?? 0), 0) / items.length);
}

/** Mức người dùng đã làm nhiều nhất trong bài (bằng nhau thì lấy mức dễ hơn); chưa có câu nào thì `fallback`. */
export function dominantLevel(sentences: DictationSentence[], fallback: DictationLevel): DictationLevel {
  const counts: Record<DictationLevel, number> = { easy: 0, normal: 0, hard: 0 };
  for (const s of scored(sentences)) if (s.latest) counts[s.latest.level]++;
  const order: DictationLevel[] = ["easy", "normal", "hard"];
  const best = order.reduce((a, b) => (counts[b] > counts[a] ? b : a));
  return counts[best] === 0 ? fallback : best;
}

/** Số câu theo mức điểm (bỏ câu bỏ cuộc). */
export function scoreBuckets(sentences: DictationSentence[]): Record<ScoreTone, number> {
  const buckets: Record<ScoreTone, number> = { good: 0, mid: 0, bad: 0 };
  for (const s of scored(sentences)) buckets[scoreTone(s.latest?.score ?? 0)]++;
  return buckets;
}

/**
 * Ghép các từ đã lộ vào chữ đã gõ ở Normal: mỗi ô từ (`slotPositions`, theo thứ tự) lấy từ đã lộ nếu có, không thì
 * lấy từ kế tiếp trong chữ đã gõ. Từ gõ dư xếp ở cuối. Khớp với cách `WordSlots` hiển thị.
 */
export function mergeRevealed(typed: string, slotPositions: number[], revealed: Readonly<Record<number, string>>): string {
  const typedWords = typed.split(/\s+/).filter(Boolean);
  const merged: string[] = [];
  let next = 0;
  for (const position of slotPositions) {
    if (position in revealed) merged.push(revealed[position]);
    else if (next < typedWords.length) merged.push(typedWords[next++]);
  }
  return [...merged, ...typedWords.slice(next)].join(" ");
}

/** Cả câu ở mức Easy cho màn kết quả: các ô trống là những từ đã chấm, còn lại là từ hiện sẵn. Null ở mức khác. */
export function resultContext(result: AttemptResult | null): PromptToken[] | null {
  if (!result || result.tokens.length === 0) return null;
  const graded = new Set(result.words.flatMap((word) => (word.position === null ? [] : [word.position])));
  return result.tokens.map((token) => ({
    position: token.position,
    display: token.display,
    length: null,
    blank: graded.has(token.position),
  }));
}

export type SubmitErrorKind = "offline" | "failed" | "easyUnavailable" | "invalidBlanks";

/** Phân loại lỗi khi nộp để hiện đúng câu; `offline` và `failed` thử lại được, hai loại còn lại cần làm lại câu. */
export function submitErrorKind(error: unknown): SubmitErrorKind {
  const apiError = toApiError(error);
  if (apiError.code === NETWORK_ERROR) return "offline";
  if (apiError.code === "DICTATION_EASY_UNAVAILABLE") return "easyUnavailable";
  if (apiError.errors.some((fe) => fe.field === "blankPositions")) return "invalidBlanks";
  return "failed";
}

export type DictationErrorKind = "network" | "notFound" | "pro" | "server";

export function errorKind(error: unknown): { kind: DictationErrorKind; code: string } {
  const apiError = toApiError(error);
  if (apiError.code === NETWORK_ERROR) return { kind: "network", code: apiError.code };
  if (apiError.code === "LESSON_PRO_REQUIRED") return { kind: "pro", code: apiError.code };
  if (apiError.status === 404) return { kind: "notFound", code: apiError.code };
  return { kind: "server", code: apiError.code };
}

/** Lỗi mất kết nối (không nhận được phản hồi), phân biệt với lỗi do máy chủ trả về. */
export const isNetworkError = (error: unknown): boolean => toApiError(error).code === NETWORK_ERROR;

/** Giới hạn của backend cho `durationMs`. */
export const MAX_DURATION_MS = 3_600_000;

/** Lượt dưới số điểm này đưa câu vào Câu cần ôn (BR-DICT-14); backend quyết định, đây chỉ để báo người học. */
export const REVIEW_ADD_BELOW = 60;
