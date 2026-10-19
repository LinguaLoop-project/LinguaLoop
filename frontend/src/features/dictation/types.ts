/** Khớp với DTO backend (feature dictation, `/api/v1/dictation/**`). Đổi DTO thì đổi cả file này. */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export type DictationLevel = "easy" | "normal" | "hard";

export type WordClass = "function" | "content" | "inflected" | "number" | "proper" | "other";

export type WordOutcome = "correct" | "omitted" | "inserted" | "substituted" | "misspelled" | "revealed";

export interface LatestResult {
  attemptId: number;
  level: DictationLevel;
  score: number;
  gaveUp: boolean;
  retry: boolean;
  attemptedAt: string;
}

export interface DictationSentence {
  id: string;
  sortOrder: number;
  startMs: number;
  endMs: number;
  wordCount: number;
  /** Chỉ có khi câu đã có kết quả. */
  text: string | null;
  textVi: string | null;
  latest: LatestResult | null;
}

export interface DictationLesson {
  id: string;
  slug: string;
  title: string;
  titleVi: string | null;
  difficulty: string | null;
  pro: boolean;
  sourceType: string | null;
  sourceUrl: string | null;
  durationSec: number | null;
  sentences: DictationSentence[];
}

export interface PromptToken {
  position: number;
  /** Chỉ có ở từ hiện sẵn (Easy). */
  display: string | null;
  length: number | null;
  blank: boolean;
}

export interface DictationPrompt {
  level: DictationLevel;
  wordCount: number;
  tokens: PromptToken[];
}

export interface GradedWord {
  /** Null ở từ thừa. */
  position: number | null;
  display: string | null;
  expectedWord: string | null;
  actualWord: string | null;
  wordClass: WordClass | null;
  outcome: WordOutcome;
  homophone: boolean;
}

export interface ClassResult {
  wordClass: WordClass;
  total: number;
  errors: number;
}

export interface AttemptResult {
  attemptId: number;
  level: DictationLevel;
  score: number;
  gaveUp: boolean;
  words: GradedWord[];
  classes: ClassResult[];
  text: string;
  textVi: string | null;
}

export interface SubmitAttemptBody {
  level: DictationLevel;
  typedText?: string;
  blanks?: Record<number, string>;
  blankPositions?: number[];
  revealedPositions?: number[];
  gaveUp?: boolean;
  retry?: boolean;
  playbackRate?: number;
  replayCount?: number;
  durationMs?: number;
}

/** Mức mà giao diện hiện đang hỗ trợ làm bài. */
export type PlayableLevel = Exclude<DictationLevel, "easy">;

export type PlaybackRate = 0.5 | 0.75 | 1;

export interface DictationSettings {
  level: PlayableLevel;
  rate: PlaybackRate;
  /** Tự phát câu tiếp theo khi sang câu mới. */
  autoNext: boolean;
  showTranslation: boolean;
  hideVideo: boolean;
}
