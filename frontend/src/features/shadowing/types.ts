import type { FeatureUsage } from "@/features/subscription/types";

/** Khớp với DTO backend (feature shadowing). Đổi DTO thì đổi cả file này. */

export type WordOutcome = "correct" | "mispronounced" | "omitted" | "inserted";

/** Ký hiệu âm vị đã đổi sang bảng phonemes (ADR 0004, cùng hệ với IPA mẫu); âm chưa đổi được giữ ký hiệu Azure. */
export interface PhonemeResult {
  symbol: string;
  accuracy: number;
  /** Mẹo sửa cho âm đọc dưới 60 điểm (khi bảng mẹo có dữ liệu). */
  tip?: string | null;
  mouthVideo?: MouthVideo | null;
}

/** Video khẩu hình (nội dung Pro): Free nhận `url` null kèm `locked: true`. */
export interface MouthVideo {
  url: string | null;
  locked: boolean;
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
  /** Lượt gần nhất của câu (để xin Nhận xét AI cho đúng lượt này). */
  attemptId: number;
  score: number;
  best: number;
  count: number;
  accuracy: number | null;
  fluency: number | null;
  completeness: number | null;
  prosody: number | null;
  words: WordResult[];
}

/** Nhận xét AI của một lượt; `cached` là true khi lượt đã có nhận xét từ trước (không trừ thêm lượt). */
export interface AiFeedback {
  attemptId: number;
  content: string;
  createdAt: string;
  cached: boolean;
  usage: FeatureUsage;
}
