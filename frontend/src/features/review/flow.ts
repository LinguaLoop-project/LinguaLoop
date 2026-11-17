import type { SentenceOutcome } from "./types";

/** Các chặng của phiên Ôn tập hằng ngày: thẻ, đoạn chuyển ngắn, câu, tổng kết (UC-HT-05). */
export type DailyPhase = "cards" | "bridge" | "sentences" | "summary";

export interface PlanLike {
  cardsInPlan: number;
  sentences: readonly unknown[];
}

/** Số câu của phiên: "Ôn tiếp" chỉ lấy thêm thẻ và không lấy thêm câu (BR-HT-24, AC-HT-37). */
const sentenceCount = (plan: PlanLike, extraRound: boolean) => (extraRound ? 0 : plan.sentences.length);

/**
 * Chặng đầu của phiên. Có thẻ thì bắt đầu bằng thẻ; không có thẻ mà có câu thì vào thẳng phần câu (luồng 2a); không có gì
 * thì báo đã ôn xong (luồng 2c).
 */
export function startPhase(plan: PlanLike, extraRound: boolean): DailyPhase | "empty" {
  if (plan.cardsInPlan > 0) return "cards";
  return sentenceCount(plan, extraRound) > 0 ? "sentences" : "empty";
}

/** Sau chặng thẻ: có câu thì qua đoạn chuyển rồi tới phần câu, không có (luồng 2b hoặc "Ôn tiếp") thì tổng kết. */
export function phaseAfterCards(plan: PlanLike, extraRound: boolean): "bridge" | "summary" {
  return sentenceCount(plan, extraRound) > 0 ? "bridge" : "summary";
}

export type StepState = "active" | "done" | "todo";

/** Trạng thái của hai chặng trên thanh tiến độ chung; chặng không có trong phiên thì `null` (không vẽ). */
export function stepStates(
  phase: DailyPhase,
  hasCards: boolean,
  hasSentences: boolean,
): { cards: StepState | null; sentences: StepState | null } {
  const cards: StepState | null = !hasCards ? null : phase === "cards" ? "active" : "done";
  const sentences: StepState | null = !hasSentences
    ? null
    : phase === "sentences" || phase === "bridge"
      ? phase === "sentences"
        ? "active"
        : "todo"
      : phase === "summary"
        ? "done"
        : "todo";
  return { cards, sentences };
}

export interface SentenceSummary {
  /** Số câu đã ôn thật (không tính câu bỏ qua). */
  reviewed: number;
  skipped: number;
  /** Điểm trung bình các câu đã ôn; null nếu chưa ôn câu nào. */
  average: number | null;
}

export function summarizeSentences(outcomes: readonly SentenceOutcome[]): SentenceSummary {
  const reviewed = outcomes.filter((o) => !o.skipped && o.score !== null);
  const total = reviewed.reduce((sum, o) => sum + (o.score ?? 0), 0);
  return {
    reviewed: reviewed.length,
    skipped: outcomes.length - reviewed.length,
    average: reviewed.length === 0 ? null : Math.round(total / reviewed.length),
  };
}
