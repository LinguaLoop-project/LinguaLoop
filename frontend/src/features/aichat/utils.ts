import type { ChatMessage, ChatSession } from "./types";

/** Độ dài câu trả lời gõ chữ hợp lệ: 1 đến 1000 ký tự sau khi bỏ khoảng trắng hai đầu (BR-AI-06). */
export const MAX_ANSWER_LENGTH = 1000;

/** Ghi âm tối đa 30 giây (BR-AI-06). */
export const MAX_RECORDING_SECONDS = 30;

/** Số giây còn lại tới mốc hết giờ, không âm. */
export function secondsLeft(expiresAt: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000));
}

/** `m:ss`, vd 14:05. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Câu hỏi đang chờ trả lời: dòng cuối là của gia sư và phiên còn mở. */
export function pendingQuestion(session: ChatSession | null | undefined): ChatMessage | null {
  if (!session || session.status !== "active") return null;
  const last = session.messages.at(-1);
  return last?.role === "tutor" ? last : null;
}

/** Số thứ tự câu hỏi hiện tại (1-based), tối đa `maxQuestions`. */
export function questionNumber(session: ChatSession): number {
  const asked = session.messages.filter((m) => m.role === "tutor").length;
  return Math.min(Math.max(asked, 1), session.maxQuestions);
}

/** Có thể kết thúc sớm: phiên còn mở và đã trả lời ít nhất một câu (BR-AI-09). */
export function canFinish(session: ChatSession | null | undefined): boolean {
  return !!session && session.status === "active" && session.answered >= 1;
}

export function validAnswerText(text: string): boolean {
  const length = [...text.trim()].length;
  return length >= 1 && length <= MAX_ANSWER_LENGTH;
}
