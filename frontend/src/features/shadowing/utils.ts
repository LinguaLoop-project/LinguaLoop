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

/** Từ dưới ngưỡng này được liệt kê ở "từ cần luyện thêm". */
export const WORD_REVIEW_BELOW = 75;

export interface DisplayWord {
  key: string;
  text: string;
  result: WordResult | null;
  /** Số thứ tự của từ trong câu mẫu (để lấy phiên âm); -1 khi không ghép được với câu mẫu. */
  tokenIndex: number;
}

/**
 * Ghép kết quả của Azure vào chữ của câu. Azure trả từ thường, bỏ dấu câu; nếu số từ khớp thì hiện lại đúng
 * chữ gốc (hoa thường, dấu câu), nếu không khớp (vd "o'clock", số) thì hiện chữ của Azure.
 */
export function alignWords(sentence: string, words: WordResult[]): DisplayWord[] {
  const tokens = sentence.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return tokens.map((text, i) => ({ key: `t${i}`, text, result: null, tokenIndex: i }));
  }
  const matches = words.filter((w) => w.outcome !== "inserted").length === tokens.length;
  let next = 0;
  return words.map((w) => {
    const aligned = matches && w.outcome !== "inserted";
    const tokenIndex = aligned ? next : -1;
    return { key: `w${w.position}`, text: aligned ? tokens[next++] : w.word, result: w, tokenIndex };
  });
}

export function recordFromAttempt(
  prev: SentenceRecord | undefined,
  a: {
    attemptId: number;
    score: number;
    accuracy: number;
    fluency: number;
    completeness: number;
    prosody: number | null;
    words: WordResult[];
  },
): SentenceRecord {
  return {
    aiFeedback: null,
    attemptId: a.attemptId,
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

/** Giây bắt đầu của liên kết YouTube (`t=4490s`, `t=75`, `start=75`); null nếu không có. */
export function youtubeStart(url: string | null | undefined): number | null {
  if (!url) return null;
  const m = url.match(/[?&#](?:t|start)=(\d+)/);
  return m ? Number(m[1]) : null;
}

/**
 * Phiên âm của từng từ, tách từ phiên âm cả câu (các từ cách nhau bởi khoảng trắng). Chỉ dùng khi số từ phiên âm
 * bằng số từ của câu; lệch (dữ liệu biên tập thiếu từ) thì trả null để hiện phiên âm cả câu thay vì gán sai từ.
 */
export function wordIpa(sentenceText: string, ipa: string | null | undefined): string[] | null {
  if (!ipa) return null;
  const words = sentenceText.split(/\s+/).filter(Boolean);
  const parts = ipa
    .split(/\s+/)
    .map((p) => p.replace(/^\/+|\/+$/g, "").replace(/[,.;:!?]+$/g, ""))
    .filter(Boolean);
  return parts.length === words.length ? parts : null;
}

/** Từ nào của câu đang được đọc ở thời điểm `fraction` (0..1), xấp xỉ theo độ dài từ. */
export function litTokenIndex(sentenceText: string, fraction: number): number {
  const words = sentenceText.split(/\s+/).filter(Boolean);
  const total = words.reduce((sum, w) => sum + w.length + 1, 0);
  let acc = 0;
  for (let i = 0; i < words.length; i++) {
    acc += (words[i].length + 1) / total;
    if (fraction <= acc) return i;
  }
  return words.length - 1;
}

/** Âm vị hay sai nhất qua các câu đã chấm (kể cả các câu khôi phục khi mở lại bài). */
export function weakPhonemes(records: Record<string, SentenceRecord>, limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const rec of Object.values(records)) {
    for (const w of rec.words) {
      for (const p of w.phonemes) {
        if (p.needsFix) counts.set(p.expected ?? p.symbol, (counts.get(p.expected ?? p.symbol) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([symbol]) => symbol);
}

/** 00:02.0 */
export function fmtClock(ms: number): string {
  // Làm tròn tới 0,1 giây trước khi tách phút, để 59,96 giây không hiện thành "00:60.0"
  const tenths = Math.round(Math.max(0, ms) / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = (tenths % 600) / 10;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

/** 00:50 */
export function fmtDuration(ms: number): string {
  const sec = Math.round(Math.max(0, ms) / 1000);
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

/** Câu chứa mốc `ms`; mốc nằm trong khoảng lặng giữa hai câu thì lấy câu gần nhất. */
export function sentenceAt(segments: { startMs: number; endMs: number }[], ms: number): number {
  let best = 0;
  let bestGap = Number.POSITIVE_INFINITY;
  segments.forEach((s, i) => {
    const gap = ms < s.startMs ? s.startMs - ms : ms > s.endMs ? ms - s.endMs : 0;
    if (gap < bestGap) {
      best = i;
      bestGap = gap;
    }
  });
  return best;
}
