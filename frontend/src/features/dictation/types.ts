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

/** Xin lộ một từ: có `position` thì lộ từ ở vị trí đó, không thì lộ từ đầu tiên chưa đúng trong `typedText`. */
export interface RevealWordBody {
  position?: number;
  typedText?: string;
}

/** Các field đều null khi chữ đã gõ đã đúng hết nên không còn từ nào để lộ. */
export interface RevealWordResult {
  position: number | null;
  /** Thứ tự trong các từ chấm được của câu (bỏ token chỉ có dấu câu). */
  index: number | null;
  word: string | null;
}

/** Gợi ý gần nhất ở mức Hard: các từ đã đúng liền trước, từ vừa lộ và thứ tự của nó trong câu. */
export interface HardHint {
  prefix: string[];
  index: number;
  word: string;
}

/** Từ đã lộ, theo vị trí token. */
export type RevealedWords = Readonly<Record<number, string>>;

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

export type PlaybackRate = 0.5 | 0.75 | 1;

export interface DictationSettings {
  level: DictationLevel;
  rate: PlaybackRate;
  /** Tự phát câu tiếp theo khi sang câu mới. */
  autoNext: boolean;
  showTranslation: boolean;
  hideVideo: boolean;
}
