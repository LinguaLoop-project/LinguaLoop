import type { PlayerApi } from "@/features/dictation/usePlayer";
import type { PlanSentence } from "../types";

/** Kết quả một câu khi học viên bấm sang câu tiếp theo; `score` null và `skipped` true nếu bỏ qua hoặc không chấm được. */
export interface StepOutcome {
  score: number | null;
  skipped: boolean;
}

export interface StepProps {
  sentence: PlanSentence;
  /** Trình phát chung của cả phiên (đổi video khi sang câu của bài khác). */
  player: PlayerApi;
  onFinished: (outcome: StepOutcome) => void;
}
