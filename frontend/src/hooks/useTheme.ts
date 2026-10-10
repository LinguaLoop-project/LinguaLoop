import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

/** Khoá lưu theme (JSON). Khoá cũ `ll_theme` của Header chỉ được đọc để giữ lựa chọn của người dùng. */
const STORAGE_KEY = "ll3-theme";
const LEGACY_KEY = "ll_theme";
const isTheme = (value: unknown): value is Theme => value === "dark" || value === "light";

/** Theme đã lưu; chưa chọn thì dark (mặc định của design system). */
function readStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isTheme(parsed)) return parsed;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (isTheme(legacy)) return legacy;
  } catch {
    // localStorage bị chặn hoặc JSON hỏng: dùng mặc định
  }
  return "dark";
}

// Một nguồn duy nhất cho mọi nút đổi theme, nên bấm ở đâu thì các nút khác cũng đổi theo.
let current: Theme = readStoredTheme();
const listeners = new Set<() => void>();

document.documentElement.dataset.theme = current;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(next: Theme) {
  current = next;
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // không lưu được thì theme chỉ có hiệu lực trong phiên này
  }
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setTheme(current === "dark" ? "light" : "dark");
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current);
  return { theme, isDark: theme === "dark", toggleTheme };
}
