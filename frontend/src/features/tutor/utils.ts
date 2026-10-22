import type { SessionOutcome, WordView } from "./types";

/** 134 giây → "2:14". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/** Chuẩn hoá giống backend (Words.normalize): chữ thường, bỏ dấu câu, giữ dấu nháy đơn. */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

export type SentenceToken = { text: string; key: string };

/** Tách câu thành các từ bấm được; bỏ phần chỉ có dấu câu. */
export function sentenceTokens(sentence: string): SentenceToken[] {
  return sentence
    .trim()
    .split(/\s+/)
    .map((text) => ({ text: text.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, ""), key: normalizeWord(text) }))
    .filter((t) => t.key !== "");
}

/** Màu chip: bad = từ lỗi chưa luyện, try = đã chấm nhưng chưa đạt, ok = đạt, warn = hết lượt, none = từ không lỗi. */
export type ChipTone = "bad" | "try" | "ok" | "warn" | "none";

export function chipTone(view: WordView | undefined): ChipTone {
  if (!view) return "none";
  if (view.status === "passed") return "ok";
  if (view.status === "needs_practice") return "warn";
  return view.attempts > 0 ? "try" : "bad";
}

export const practiced = (words: WordView[]): WordView[] => words.filter((w) => w.attempts > 0 || w.best !== undefined);

/** Giọng điệu thẻ kết quả phiên. */
export function outcomeTone(outcome: SessionOutcome): "ok" | "warn" | "bad" | "neutral" {
  switch (outcome) {
    case "completed":
      return "ok";
    case "connect_failed":
      return "bad";
    case "learner_exit":
      return "neutral";
    default:
      return "warn";
  }
}

/** Mã lỗi khi tạo phiên mà thử lại ngay không có ích (hết lượt, quá nhiều lần hỏng, chưa đồng ý AI). */
export const NO_RETRY_CODES: ReadonlySet<string> = new Set([
  "QUOTA_EXCEEDED",
  "TUTOR_TOO_MANY_FAILED_STARTS",
  "AI_CONSENT_REQUIRED",
]);

/** Mã lỗi có câu giải thích riêng trong i18n (`student.tutor.fallback.<mã>`); mã khác dùng câu chung kèm lời server. */
export const FALLBACK_TEXT_CODES: ReadonlySet<string> = new Set([
  ...NO_RETRY_CODES,
  "TUTOR_LIVE_UNAVAILABLE",
  "MIC_UNAVAILABLE",
  "START_TIMEOUT",
  "CONNECT_ERROR",
  "CONNECTION_CLOSED",
]);
