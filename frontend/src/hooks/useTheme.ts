import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";
export type ThemeMode = "light" | "dark" | "system";

/** Khoá lưu theme (JSON). Khoá cũ `ll_theme` của Header chỉ được đọc để giữ lựa chọn của người dùng. */
const STORAGE_KEY = "ll3-theme";
const LEGACY_KEY = "ll_theme";

const isTheme = (value: unknown): value is Theme => value === "dark" || value === "light";
const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "dark" || value === "light" || value === "system";

function systemTheme(): Theme {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function resolveTheme(mode: ThemeMode): Theme {
  return mode === "system" ? systemTheme() : mode;
}

/** Chế độ màu đã lưu; chưa chọn thì dùng `system` (theo cài đặt thiết bị, DESIGN.v2 §9). */
function readStoredMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isThemeMode(parsed)) return parsed;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (isTheme(legacy)) return legacy;
  } catch {
    // localStorage bị chặn hoặc JSON hỏng: dùng mặc định
  }
  return "system";
}

interface ThemeSnapshot {
  mode: ThemeMode;
  theme: Theme;
}

// Một nguồn duy nhất cho mọi nút đổi theme, nên bấm ở đâu thì các nút khác cũng đổi theo.
const initialMode = readStoredMode();
let snapshot: ThemeSnapshot = { mode: initialMode, theme: resolveTheme(initialMode) };
const listeners = new Set<() => void>();

function applyDom(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}

applyDom(snapshot.theme);

// Khi chọn "Theo thiết bị", tự cập nhật ngay nếu người dùng đổi Dark/Light ở hệ điều hành.
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  const onSystemChange = () => {
    if (snapshot.mode !== "system") return;
    const nextTheme = resolveTheme("system");
    if (nextTheme === snapshot.theme) return;
    snapshot = { mode: "system", theme: nextTheme };
    applyDom(nextTheme);
    listeners.forEach((listener) => listener());
  };
  media.addEventListener?.("change", onSystemChange);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTheme(next: ThemeMode) {
  const resolved = resolveTheme(next);
  snapshot = { mode: next, theme: resolved };
  applyDom(resolved);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // không lưu được thì theme chỉ có hiệu lực trong phiên này
  }
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setTheme(snapshot.theme === "dark" ? "light" : "dark");
}

export function useTheme() {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  return { theme: state.theme, mode: state.mode, isDark: state.theme === "dark", toggleTheme };
}
