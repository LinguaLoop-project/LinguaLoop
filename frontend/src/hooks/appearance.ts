import type { ThemeMode } from "./useTheme";

/**
 * Cá nhân hóa giao diện (UC-TK-10, BR-TK-21): màu nhấn (đồng bộ nền/viền/chữ phụ), cỡ chữ câu luyện tập, nền giao diện toàn ứng dụng, kiểu bo góc và giảm chuyển động. Lưu trên trình duyệt và áp qua thuộc tính `data-*` của thẻ html để CSS đổi biến
 * màu ngay, không cần tải lại trang.
 */
export const ACCENTS = ["violet", "blue", "pink", "green", "amber", "slate"] as const;
export const SENTENCE_SIZES = ["md", "lg"] as const;
/** Nền toàn ứng dụng. Tên `learnBackground` giữ từ lúc nền chỉ áp cho trang học, để không làm mất lựa chọn đã lưu. */
export const LEARN_BACKGROUNDS = ["none", "paper", "gradient", "aurora", "dots", "grid"] as const;
export const CORNER_STYLES = ["rounded", "balanced", "sharp"] as const;

export type Accent = (typeof ACCENTS)[number];
export type SentenceSize = (typeof SENTENCE_SIZES)[number];
export type LearnBackground = (typeof LEARN_BACKGROUNDS)[number];
export type CornerStyle = (typeof CORNER_STYLES)[number];

export interface Appearance {
  accent: Accent;
  sentenceSize: SentenceSize;
  learnBackground: LearnBackground;
  cornerStyle: CornerStyle;
  reduceMotion: boolean;
}

/** Mặc định hệ thống khớp gói Tím Vũ Trụ (`cosmic`): nền cực quang, màu tím, bo mềm. */
export const DEFAULT_APPEARANCE: Appearance = {
  accent: "violet",
  sentenceSize: "md",
  learnBackground: "aurora",
  cornerStyle: "rounded",
  reduceMotion: false,
};

export interface ThemePreset {
  id: "cosmic" | "ocean" | "paperFocus" | "emeraldCalm" | "sakuraLight" | "minimal";
  mode: ThemeMode;
  accent: Accent;
  learnBackground: LearnBackground;
  cornerStyle: CornerStyle;
  /** Màu hiển thị minh hoạ nhanh trên thẻ preset (nền, thẻ, điểm nhấn). */
  preview: { bg: string; surface: string; primary: string };
}

/** Các gói giao diện đồng bộ 1 chạm; chọn xong vẫn tùy chỉnh lẻ từng mục được. */
export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: "cosmic",
    mode: "dark",
    accent: "violet",
    learnBackground: "aurora",
    cornerStyle: "rounded",
    preview: { bg: "#07050D", surface: "#140F24", primary: "#8B5CF6" },
  },
  {
    id: "ocean",
    mode: "dark",
    accent: "blue",
    learnBackground: "gradient",
    cornerStyle: "rounded",
    preview: { bg: "#050914", surface: "#0F172A", primary: "#3B82F6" },
  },
  {
    id: "paperFocus",
    mode: "light",
    accent: "amber",
    learnBackground: "paper",
    cornerStyle: "balanced",
    preview: { bg: "#F6F0E2", surface: "#FFFFFF", primary: "#D97706" },
  },
  {
    id: "emeraldCalm",
    mode: "dark",
    accent: "green",
    learnBackground: "dots",
    cornerStyle: "rounded",
    preview: { bg: "#050D0A", surface: "#0F201A", primary: "#10B981" },
  },
  {
    id: "sakuraLight",
    mode: "light",
    accent: "pink",
    learnBackground: "aurora",
    cornerStyle: "rounded",
    preview: { bg: "#FFF7FA", surface: "#FFFFFF", primary: "#DB2777" },
  },
  {
    id: "minimal",
    mode: "system",
    accent: "slate",
    learnBackground: "grid",
    cornerStyle: "sharp",
    preview: { bg: "#111114", surface: "#18181B", primary: "#E4E4E7" },
  },
] as const;

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
      cornerStyle: pick(CORNER_STYLES, v.cornerStyle, DEFAULT_APPEARANCE.cornerStyle),
      reduceMotion: typeof v.reduceMotion === "boolean" ? v.reduceMotion : DEFAULT_APPEARANCE.reduceMotion,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}
