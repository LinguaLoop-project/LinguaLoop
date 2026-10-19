import { NETWORK_ERROR, toApiError } from "@/features/auth";
import type { DictationLevel, DictationSentence } from "./types";

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

/** Chỉ số câu chưa làm đầu tiên sau `after` (quay vòng về đầu bài); -1 nếu đã làm hết. */
export function firstUndoneIndex(sentences: DictationSentence[], after: number): number {
  for (let i = after + 1; i < sentences.length; i++) if (!sentences[i].latest) return i;
  for (let i = 0; i <= Math.min(after, sentences.length - 1); i++) if (!sentences[i].latest) return i;
  return -1;
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
