/** Mốc thời gian câu hiển thị dạng "mm:ss.s" (AC-BH-36: "00:12.0"). */
export function formatMs(ms: number): string {
  const tenths = Math.round(ms / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = (tenths % 600) / 10;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}

/**
 * Đọc "mm:ss.s", "m:ss" hoặc số giây ("12.5"); trả mili giây, hoặc `null` nếu không đọc được. Không nhận giá trị âm.
 */
export function parseMs(text: string): number | null {
  const value = text.trim().replace(",", ".");
  const match = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(value);
  if (!match) return null;
  const minutes = match[1] ? Number(match[1]) : 0;
  const seconds = Number(match[2]);
  if (match[1] && seconds >= 60) return null;
  return Math.round((minutes * 60 + seconds) * 1000);
}

export function formatDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(language === "en" ? "en-GB" : "vi-VN");
}
