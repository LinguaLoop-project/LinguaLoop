/** Số có dấu phân cách theo ngôn ngữ (vd 95482 → "95.482" ở tiếng Việt), như `fmtNum` của mockup. */
export function formatCount(n: number, locale = "vi-VN"): string {
  return n.toLocaleString(locale);
}

/** Giây → "mm:ss" (vd 125 → "02:05"), như thời lượng trên thẻ bài của mockup. */
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

/** Mili giây → "mm:ss", dùng cho mốc thời gian của câu. */
export function formatTimeMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

/** Lấy mã video 11 ký tự từ link YouTube (watch, youtu.be, embed, shorts) hoặc chính mã đó; không khớp thì null. */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}
