import type { FeatureUsage } from "@/features/subscription/types";

/** Khớp với DTO backend (feature shadowing). Đổi DTO thì đổi cả file này. */

export type WordOutcome = "correct" | "mispronounced" | "omitted" | "inserted";

/** Ký hiệu âm vị giữ như Azure trả về (IPA giọng Mỹ), không phải ký hiệu trong bảng phonemes (ADR 0004). */
export interface PhonemeResult {
  symbol: string;
  accuracy: number;
}

export interface WordResult {
  position: number;
  word: string;
  accuracy: number;
  outcome: WordOutcome;
  /** Rỗng khi kết quả được khôi phục từ lượt cũ (DB không giữ ký hiệu Azure). */
  phonemes: PhonemeResult[];
}

export interface AttemptResponse {
  attemptId: number;
  sentenceId: string;
  score: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number | null;
  recognizedText: string;
  words: WordResult[];
  usage: FeatureUsage;
}

export interface LatestAttempt {
  sentenceId: string;
  attemptId: number;
  score: number;
  attemptedAt: string;
  bestScore: number;
  attemptCount: number;
  words: { position: number; word: string; accuracy: number; outcome: WordOutcome }[];
}

/** Kết quả của một câu trong trang luyện: lượt gần nhất + điểm cao nhất + số lần đọc. */
export interface SentenceRecord {
  score: number;
  best: number;
  count: number;
  accuracy: number | null;
  fluency: number | null;
  completeness: number | null;
  prosody: number | null;
  words: WordResult[];
}
