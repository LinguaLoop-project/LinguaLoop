import type { AttemptTarget, SessionOutcome, TopicCategory, TutorLimits } from "./types";

/** Trạng thái điều khiển phiên phía trình duyệt. */
export type Phase = "idle" | "connecting" | "live" | "scoring" | "assessing" | "ended" | "fallback";

/** Tham số tool của gia sư là chuỗi tự do từ mô hình: luôn ép về giá trị hợp lệ. */
export const parseOutcome = (value: unknown): SessionOutcome =>
  value === "completed" || value === "off_topic" ? value : "learner_exit";

export const parseTopic = (value: unknown): TopicCategory => (value === "off_topic" ? "off_topic" : "on_topic");

export const parseTarget = (value: unknown): AttemptTarget => (value === "sentence" ? "sentence" : "word");

export type Clock = {
  /** Thời gian đã học, không đếm giờ chờ Azure. */
  activeMs: number;
  /** Thời gian im lặng liên tục (chỉ đếm khi không ai đang nói). */
  idleMs: number;
  idleAsked: boolean;
  wrapUpSent: boolean;
};

export type TickAction = "timeout" | "wrapUp" | "idleAsk" | "idleEnd";

export type TickInput = Clock & {
  dtMs: number;
  phase: Phase;
  holding: boolean;
  tutorSpeaking: boolean;
  limits: TutorLimits;
};

/**
 * Một nhịp đồng hồ (250 ms): cộng thời gian đã học, chốt ở trần, nhắc chốt lại trước trần, và xử lý im lặng: không ai
 * nói quá `idleAskSeconds` thì gia sư hỏi, quá `idleEndSeconds` thì kết thúc (ADR 0003). `timeout` trả sớm, các hành
 * động khác có thể đi cùng nhau.
 */
export function tick(input: TickInput): Clock & { seconds: number; actions: TickAction[] } {
  const { dtMs, phase, holding, tutorSpeaking, limits } = input;
  const activeMs = phase === "assessing" ? input.activeMs : input.activeMs + dtMs;
  const seconds = activeMs / 1000;
  if (seconds >= limits.maxSeconds) {
    return { ...input, activeMs, seconds: Math.floor(seconds), actions: ["timeout"] };
  }

  const actions: TickAction[] = [];
  if (seconds >= limits.wrapUpAtSeconds && !input.wrapUpSent && phase === "live") actions.push("wrapUp");

  // Gia sư đang nói thì tạm dừng đếm, không xoá
  const waiting = (phase === "live" || (phase === "scoring" && !holding)) && !tutorSpeaking;
  const idleMs = waiting ? input.idleMs + dtMs : input.idleMs;
  let idleAsked = input.idleAsked;
  if (phase === "live" && !idleAsked && idleMs >= limits.idleAskSeconds * 1000) {
    idleAsked = true;
    actions.push("idleAsk");
  }
  if (idleMs >= limits.idleEndSeconds * 1000) actions.push("idleEnd");

  return { activeMs, idleMs, idleAsked, wrapUpSent: input.wrapUpSent, seconds: Math.floor(seconds), actions };
}
