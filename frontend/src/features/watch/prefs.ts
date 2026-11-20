/** Các tốc độ phát được chọn (BR-TC-15). */
export const RATES = [0.5, 0.75, 1, 1.25, 1.5] as const;
export type Rate = (typeof RATES)[number];

export const CAPTION_SIZES = ["sm", "md", "lg"] as const;
export type CaptionSize = (typeof CAPTION_SIZES)[number];

/** Lựa chọn của học viên, giữ nguyên khi lướt sang video khác và nhớ cho lần mở sau. */
export interface WatchPrefs {
  rate: Rate;
  captions: boolean;
  translation: boolean;
  ipa: boolean;
  size: CaptionSize;
}

export const DEFAULT_PREFS: WatchPrefs = { rate: 1, captions: true, translation: false, ipa: false, size: "md" };

const STORAGE_KEY = "ll.watch.prefs";

/** Đọc lựa chọn đã lưu; giá trị hỏng hoặc thiếu thì dùng mặc định cho từng mục. */
export function parsePrefs(raw: string | null): WatchPrefs {
  if (!raw) return DEFAULT_PREFS;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return DEFAULT_PREFS;
  }
  if (!value || typeof value !== "object") return DEFAULT_PREFS;
  const v = value as Record<string, unknown>;
  const bool = (key: keyof WatchPrefs) => (typeof v[key] === "boolean" ? (v[key] as boolean) : (DEFAULT_PREFS[key] as boolean));
  return {
    rate: RATES.includes(v.rate as Rate) ? (v.rate as Rate) : DEFAULT_PREFS.rate,
    captions: bool("captions"),
    translation: bool("translation"),
    ipa: bool("ipa"),
    size: CAPTION_SIZES.includes(v.size as CaptionSize) ? (v.size as CaptionSize) : DEFAULT_PREFS.size,
  };
}

export function loadPrefs(): WatchPrefs {
  try {
    return parsePrefs(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: WatchPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage bị chặn: lựa chọn chỉ giữ trong phiên này
  }
}
