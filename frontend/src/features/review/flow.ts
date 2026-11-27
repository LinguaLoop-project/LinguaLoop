import type { CardSources, SentenceOutcome, TodaySuggestions } from "./types";

/** Các chặng của phiên Luyện tập hằng ngày: thẻ, đoạn chuyển ngắn, câu, tổng kết (UC-HT-05). */
export type DailyPhase = "cards" | "bridge" | "sentences" | "summary";

export interface PlanLike {
  cardsInPlan: number;
  /** Số thẻ của một lượt "Ôn thêm" (không tính định mức). */
  cardsMore: number;
  sentences: readonly unknown[];
}

/**
 * Số thẻ của lượt: phần định mức ngày còn lại; ở lượt "Ôn thêm" thì lấy theo số thẻ còn đến hạn, không tính định mức vì
 * học viên đã chọn ôn vượt mức (BR-HT-24).
 */
export const cardCount = (plan: PlanLike, extraRound: boolean) => (extraRound ? plan.cardsMore : plan.cardsInPlan);

/** Số câu của phiên: "Ôn thêm" chỉ lấy thêm thẻ và không lấy thêm câu (BR-HT-24, AC-HT-37). */
const sentenceCount = (plan: PlanLike, extraRound: boolean) => (extraRound ? 0 : plan.sentences.length);

/**
 * Chặng đầu của phiên. Có thẻ thì bắt đầu bằng thẻ; không có thẻ mà có câu thì vào thẳng phần câu (luồng 2a); không có gì
 * thì báo đã ôn xong (luồng 2c).
 */
export function startPhase(plan: PlanLike, extraRound: boolean): DailyPhase | "empty" {
  if (cardCount(plan, extraRound) > 0) return "cards";
  return sentenceCount(plan, extraRound) > 0 ? "sentences" : "empty";
}

/** Sau chặng thẻ: có câu thì qua đoạn chuyển rồi tới phần câu, không có (luồng 2b hoặc "Ôn tiếp") thì tổng kết. */
export function phaseAfterCards(plan: PlanLike, extraRound: boolean): "bridge" | "summary" {
  return sentenceCount(plan, extraRound) > 0 ? "bridge" : "summary";
}

export type CardSourceKey = keyof CardSources;

/**
 * Các nguồn có thẻ của phiên theo thứ tự thẻ đến hạn, từ mới, thẻ củng cố; nguồn không có thẻ thì bỏ (BR-HT-29). Dùng để
 * ghi rõ phiên hôm nay gồm những gì.
 */
export function cardSourceParts(sources: CardSources | null | undefined): { key: CardSourceKey; count: number }[] {
  if (!sources) return [];
  return (["due", "newWords", "reinforce"] as const)
    .map((key) => ({ key, count: sources[key] }))
    .filter((part) => part.count > 0);
}

/** Có đáng ghi chú nguồn thẻ không: chỉ khi phiên có từ mới hoặc thẻ củng cố, còn toàn thẻ đến hạn thì không cần. */
export function hasFilledCards(sources: CardSources | null | undefined): boolean {
  return cardSourceParts(sources).some((part) => part.key !== "due");
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

/** Có ít nhất một việc gợi ý để hiện (không có thì giữ hai nút "Học từ mới" và "Luyện bài học"). */
export function hasSuggestions(suggestions: TodaySuggestions | null | undefined): suggestions is TodaySuggestions {
  return Boolean(suggestions && (suggestions.newWords || suggestions.dictationLesson || suggestions.shadowingLesson));
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
