import { useSyncExternalStore } from "react";
import {
  ACCENTS,
  CORNER_STYLES,
  DEFAULT_APPEARANCE,
  LEARN_BACKGROUNDS,
  SENTENCE_SIZES,
  THEME_PRESETS,
  parseAppearance,
  type Accent,
  type Appearance,
  type CornerStyle,
  type LearnBackground,
  type SentenceSize,
  type ThemePreset,
} from "./appearance";

export {
  ACCENTS,
  CORNER_STYLES,
  DEFAULT_APPEARANCE,
  LEARN_BACKGROUNDS,
  SENTENCE_SIZES,
  THEME_PRESETS,
  parseAppearance,
};
export type { Accent, Appearance, CornerStyle, LearnBackground, SentenceSize, ThemePreset };

const STORAGE_KEY = "ll.appearance";

function readStored(): Appearance {
  try {
    return parseAppearance(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

let current: Appearance = readStored();
const listeners = new Set<() => void>();

function apply(value: Appearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement.dataset;
  root.accent = value.accent;
  root.sentence = value.sentenceSize;
  root.learnBg = value.learnBackground;
  root.corners = value.cornerStyle;
  if (value.reduceMotion) root.motion = "reduced";
  else delete root.motion;
}

apply(current);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Đổi một hay nhiều mục, áp ngay; trả `false` nếu trình duyệt chặn lưu trữ (lựa chọn chỉ có hiệu lực trong phiên). */
export function setAppearance(changes: Partial<Appearance>): boolean {
  current = { ...current, ...changes };
  apply(current);
  listeners.forEach((listener) => listener());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return true;
  } catch {
    return false;
  }
}

/** Khách chưa đăng nhập (hoặc vừa đăng xuất) thấy mặc định Tím Vũ Trụ; không xoá lựa chọn đã lưu của học viên. */
export function showDefaultAppearance() {
  current = DEFAULT_APPEARANCE;
  apply(current);
  listeners.forEach((listener) => listener());
}

/** Đăng nhập xong thì áp lại giao diện học viên đã lưu trên trình duyệt này. */
export function restoreStoredAppearance() {
  current = readStored();
  apply(current);
  listeners.forEach((listener) => listener());
}

/** Đưa giao diện về mặc định hệ thống (Tím Vũ Trụ) và xoá tuỳ chỉnh đã lưu. */
export function resetAppearance(): boolean {
  current = DEFAULT_APPEARANCE;
  apply(current);
  listeners.forEach((listener) => listener());
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, () => current);
}
