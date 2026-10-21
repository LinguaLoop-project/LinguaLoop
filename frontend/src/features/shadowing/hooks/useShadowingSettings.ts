import { useCallback, useState } from "react";

export interface ShadowingSettings {
  /** Tốc độ phát mẫu: "0.5", "0.75" hoặc "1". */
  rate: string;
  /** Hiện phiên âm của câu. */
  ipa: boolean;
  /** Hiện bản dịch tiếng Việt dưới câu và trong danh sách. */
  vi: boolean;
  /** Phụ đề ở tab Xem. */
  subs: boolean;
  /** Ẩn khung video (âm thanh vẫn phát). */
  hideVideo: boolean;
}

export const RATES = ["0.5", "0.75", "1"] as const;

const STORAGE_KEY = "ll2-sh-settings";
const DEFAULTS: ShadowingSettings = { rate: "0.75", ipa: true, vi: true, subs: false, hideVideo: false };

function load(): ShadowingSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<ShadowingSettings>;
    const merged = { ...DEFAULTS, ...stored };
    return RATES.includes(merged.rate as (typeof RATES)[number]) ? merged : { ...merged, rate: DEFAULTS.rate };
  } catch {
    return DEFAULTS; // localStorage bị chặn hoặc dữ liệu hỏng
  }
}

/** Cài đặt của trang shadowing, lưu theo trình duyệt (cùng khoá với mockup v2). */
export function useShadowingSettings() {
  const [settings, setSettings] = useState<ShadowingSettings>(load);

  const update = useCallback((patch: Partial<ShadowingSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // không lưu được thì vẫn dùng trong phiên này
      }
      return next;
    });
  }, []);

  return { settings, update };
}
