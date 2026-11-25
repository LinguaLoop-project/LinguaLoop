/**
 * Cá nhân hóa giao diện (UC-TK-10, BR-TK-21): màu nhấn, cỡ chữ câu luyện tập và nền các trang học. Lưu trên trình duyệt và
 * áp qua thuộc tính `data-*` của thẻ html để CSS đổi biến màu, không cần tải lại trang.
 */
export const ACCENTS = ["violet", "blue", "pink", "green"] as const;
export const SENTENCE_SIZES = ["md", "lg"] as const;
export const LEARN_BACKGROUNDS = ["none", "paper", "gradient"] as const;

export type Accent = (typeof ACCENTS)[number];
export type SentenceSize = (typeof SENTENCE_SIZES)[number];
export type LearnBackground = (typeof LEARN_BACKGROUNDS)[number];

export interface Appearance {
  accent: Accent;
  sentenceSize: SentenceSize;
  learnBackground: LearnBackground;
}

export const DEFAULT_APPEARANCE: Appearance = { accent: "violet", sentenceSize: "md", learnBackground: "none" };

function pick<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Đọc chuỗi đã lưu; thiếu, hỏng hoặc giá trị lạ thì dùng mặc định cho từng mục. */
export function parseAppearance(raw: string | null): Appearance {
  if (!raw) return DEFAULT_APPEARANCE;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return DEFAULT_APPEARANCE;
    const v = value as Record<string, unknown>;
    return {
      accent: pick(ACCENTS, v.accent, DEFAULT_APPEARANCE.accent),
      sentenceSize: pick(SENTENCE_SIZES, v.sentenceSize, DEFAULT_APPEARANCE.sentenceSize),
      learnBackground: pick(LEARN_BACKGROUNDS, v.learnBackground, DEFAULT_APPEARANCE.learnBackground),
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}
