import type { SentenceRecord, WordResult } from "./types";

export type Tone = "good" | "mid" | "bad";

/** BR-SHADOW-04: từ 80 là tốt, từ 60 là khá, dưới 60 cần sửa. */
export const toneOf = (score: number): Tone => (score >= 80 ? "good" : score >= 60 ? "mid" : "bad");

export const TONE_TEXT: Record<Tone, string> = {
  good: "text-success",
  mid: "text-warning",
  bad: "text-danger",
};

export const TONE_BOX: Record<Tone, string> = {
  good: "border-success/40 bg-success/10",
  mid: "border-warning/40 bg-warning/10",
  bad: "border-danger/40 bg-danger/10",
};

/** Âm vị dưới ngưỡng này được coi là lỗi. */
export const PHONEME_ERROR_BELOW = 60;
/** Từ dưới ngưỡng này được liệt kê ở "từ cần luyện thêm". */
export const WORD_REVIEW_BELOW = 75;

export interface DisplayWord {
  key: string;
  text: string;
  result: WordResult | null;
}

/**
 * Ghép kết quả của Azure vào chữ của câu. Azure trả từ thường, bỏ dấu câu; nếu số từ khớp thì hiện lại đúng
 * chữ gốc (hoa thường, dấu câu), nếu không khớp (vd "o'clock", số) thì hiện chữ của Azure.
 */
export function alignWords(sentence: string, words: WordResult[]): DisplayWord[] {
  const tokens = sentence.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return tokens.map((text, i) => ({ key: `t${i}`, text, result: null }));
  }
  const matches = words.filter((w) => w.outcome !== "inserted").length === tokens.length;
  let next = 0;
  return words.map((w) => ({
    key: `w${w.position}`,
    text: matches && w.outcome !== "inserted" ? tokens[next++] : w.word,
    result: w,
  }));
}

export function recordFromAttempt(
  prev: SentenceRecord | undefined,
  a: {
    score: number;
    accuracy: number;
    fluency: number;
    completeness: number;
    prosody: number | null;
    words: WordResult[];
  },
): SentenceRecord {
  return {
    score: a.score,
    best: Math.max(prev?.best ?? 0, a.score),
    count: (prev?.count ?? 0) + 1,
    accuracy: a.accuracy,
    fluency: a.fluency,
    completeness: a.completeness,
    prosody: a.prosody,
    words: a.words,
  };
}

/** Che chữ của câu chưa đọc trong danh sách (chỉ giữ dấu câu), để người học nghe trước rồi mới nhìn chữ. */
export const maskText = (text: string): string => text.replace(/[A-Za-z0-9']/g, "*");

/** ID video từ liên kết YouTube (watch, youtu.be, embed, shorts); null nếu không phải YouTube. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}
