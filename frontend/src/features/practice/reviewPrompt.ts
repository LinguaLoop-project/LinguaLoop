import { REVIEW_ADD_BELOW, REVIEW_RESOLVE_AT } from "./constants";
import type { PracticeMode } from "./types";

/** Hỏi lưu câu (sau lượt điểm thấp) hoặc hỏi bỏ câu (sau lượt tốt) khỏi Câu cần ôn. */
export type ReviewPromptKind = "save" | "remove";

export interface ReviewPrompt {
  kind: ReviewPromptKind;
  sentenceId: string;
  mode: PracticeMode;
  score: number;
}

/**
 * Sau một lượt có nên hỏi người học không (BR-DICT-14, BR-DICT-15, BR-SHADOW-15): dưới 60 điểm mà câu chưa ở trong
 * danh sách thì hỏi lưu, từ 80 điểm mà câu đang ở trong danh sách thì hỏi bỏ; còn lại không hỏi. Hệ thống không tự đổi
 * danh sách và không nhớ lần người học chọn "Không".
 */
export function reviewPromptKind(score: number, inList: boolean): ReviewPromptKind | null {
  if (score < REVIEW_ADD_BELOW && !inList) return "save";
  if (score >= REVIEW_RESOLVE_AT && inList) return "remove";
  return null;
}
