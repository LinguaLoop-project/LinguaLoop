/**
 * Tùy chọn luyện tập mặc định (UC-TK-10, BR-TK-20): đọc và ghi đúng các khóa localStorage mà Nghe chép, Shadowing và Xem
 * đang dùng, nên chỉnh ở Cài đặt có hiệu lực ở lần mở trang luyện tập kế tiếp. Chỉ đụng các trường được chỉnh ở đây, giữ
 * nguyên phần còn lại; giá trị lạ hoặc hỏng thì dùng mặc định của từng trang.
 */
export const DICTATION_KEY = "ll-dict-settings";
export const SHADOWING_KEY = "ll2-sh-settings";
export const WATCH_KEY = "ll.watch.prefs";

export const DICTATION_RATES = [0.5, 0.75, 1] as const;
export const SHADOWING_RATES = ["0.5", "0.75", "1"] as const;
export const WATCH_RATES = [0.5, 0.75, 1, 1.25, 1.5] as const;
export type Accent = "us" | "uk";

export interface PracticePrefs {
  dictation: { rate: number; autoNext: boolean; showTranslation: boolean };
  shadowing: { rate: string; ipa: boolean; accent: Accent; vi: boolean };
  watch: { rate: number; ipa: boolean; translation: boolean };
}

export const DEFAULT_PRACTICE_PREFS: PracticePrefs = {
  dictation: { rate: 0.75, autoNext: false, showTranslation: true },
  shadowing: { rate: "0.75", ipa: true, accent: "us", vi: true },
  watch: { rate: 1, ipa: false, translation: false },
};

function parseObject(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Đọc từ ba chuỗi đã lưu (`null` nếu chưa có). */
export function parsePracticePrefs(raw: { dictation: string | null; shadowing: string | null; watch: string | null }): PracticePrefs {
  const d = parseObject(raw.dictation);
  const s = parseObject(raw.shadowing);
  const w = parseObject(raw.watch);
  const def = DEFAULT_PRACTICE_PREFS;
  return {
    dictation: {
      rate: pick(DICTATION_RATES, d.rate, def.dictation.rate),
      autoNext: bool(d.autoNext, def.dictation.autoNext),
      showTranslation: bool(d.showTranslation, def.dictation.showTranslation),
    },
    shadowing: {
      rate: pick(SHADOWING_RATES, s.rate, def.shadowing.rate),
      ipa: bool(s.ipa, def.shadowing.ipa),
      accent: s.accent === "uk" ? "uk" : "us",
      vi: bool(s.vi, def.shadowing.vi),
    },
    watch: {
      rate: pick(WATCH_RATES, w.rate, def.watch.rate),
      ipa: bool(w.ipa, def.watch.ipa),
      translation: bool(w.translation, def.watch.translation),
    },
  };
}

/** Ghi chồng các trường đã chỉnh lên chuỗi đã lưu, giữ nguyên trường khác (ví dụ ẩn video, cỡ phụ đề). */
export function mergeStored(raw: string | null, changes: Record<string, unknown>): string {
  return JSON.stringify({ ...parseObject(raw), ...changes });
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function loadPracticePrefs(): PracticePrefs {
  return parsePracticePrefs({ dictation: read(DICTATION_KEY), shadowing: read(SHADOWING_KEY), watch: read(WATCH_KEY) });
}

/** Trả `false` nếu trình duyệt chặn lưu trữ (lựa chọn khi đó không giữ được). */
export function savePracticePref(key: string, changes: Record<string, unknown>): boolean {
  try {
    localStorage.setItem(key, mergeStored(read(key), changes));
    return true;
  } catch {
    return false;
  }
}
