import type { ChatLimits } from "./types";

/** Tham số tool của gia sư là chuỗi tự do từ mô hình: luôn ép về chuỗi. */
export const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export type Clock = {
  /** Thời gian đã học, tính từ lúc gia sư nói câu đầu. */
  activeMs: number;
  /** Thời gian im lặng liên tục (chỉ đếm khi gia sư không nói). */
  idleMs: number;
  idleAsked: boolean;
  wrapUpSent: boolean;
};

export type TickAction = "timeout" | "wrapUp" | "idleAsk" | "idleEnd";

export type TickInput = Clock & {
  dtMs: number;
  tutorSpeaking: boolean;
  limits: ChatLimits;
};

/**
 * Một nhịp đồng hồ (250 ms): cộng thời gian, chốt ở trần 15 phút, nhắc gia sư chốt lại trước trần, và xử lý im lặng:
 * không ai nói quá `idleAskSeconds` thì gia sư hỏi, quá `idleEndSeconds` thì kết thúc. `timeout` trả sớm, các hành động
 * khác có thể đi cùng nhau.
 */
export function tick(input: TickInput): Clock & { seconds: number; actions: TickAction[] } {
  const { dtMs, tutorSpeaking, limits } = input;
  const activeMs = input.activeMs + dtMs;
  const seconds = activeMs / 1000;
  if (seconds >= limits.maxSeconds) {
    return { ...input, activeMs, seconds: Math.floor(seconds), actions: ["timeout"] };
  }

  const actions: TickAction[] = [];
  if (seconds >= limits.wrapUpAtSeconds && !input.wrapUpSent) actions.push("wrapUp");

  // Gia sư đang nói thì tạm dừng đếm, không xoá
  const idleMs = tutorSpeaking ? input.idleMs : input.idleMs + dtMs;
  let idleAsked = input.idleAsked;
  if (!idleAsked && idleMs >= limits.idleAskSeconds * 1000) {
    idleAsked = true;
    actions.push("idleAsk");
  }
  if (idleMs >= limits.idleEndSeconds * 1000) actions.push("idleEnd");

  return { activeMs, idleMs, idleAsked, wrapUpSent: input.wrapUpSent, seconds: Math.floor(seconds), actions };
}
