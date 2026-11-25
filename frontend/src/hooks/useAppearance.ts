import { useEffect, useSyncExternalStore } from "react";
import { DEFAULT_APPEARANCE, parseAppearance, type Appearance } from "./appearance";

export { ACCENTS, DEFAULT_APPEARANCE, LEARN_BACKGROUNDS, SENTENCE_SIZES, parseAppearance } from "./appearance";
export type { Accent, Appearance, LearnBackground, SentenceSize } from "./appearance";

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
  const root = document.documentElement.dataset;
  root.accent = value.accent;
  root.sentence = value.sentenceSize;
  root.learnBg = value.learnBackground;
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

export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, () => current);
}

/** Đánh dấu trang đang mở là trang học để nền học viên chọn được áp dụng; gỡ dấu khi rời trang. */
export function useLearnPageBackground() {
  useEffect(() => {
    const root = document.documentElement.dataset;
    root.learnPage = "true";
    return () => {
      delete root.learnPage;
    };
  }, []);
}
