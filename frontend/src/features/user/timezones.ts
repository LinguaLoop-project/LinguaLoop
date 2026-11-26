/** Múi giờ của thiết bị; trình duyệt không cho biết thì trả `null`. */
export function detectTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

const FALLBACK_ZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

/**
 * Danh sách múi giờ để chọn. Luôn có `current` để giá trị đang lưu không biến mất khỏi ô chọn, kể cả khi trình duyệt
 * dùng tên khác (vd Asia/Saigon thay vì Asia/Ho_Chi_Minh).
 */
export function timezoneOptions(current: string): string[] {
  let zones: string[];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = FALLBACK_ZONES;
  }
  const set = new Set(zones);
  if (current) set.add(current);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Chuỗi lệch múi giờ dạng `UTC+07:00` (hoặc `UTC` nếu bằng 0 / trình duyệt không hỗ trợ). */
export function formatTimezoneOffset(zone: string, now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset",
    }).formatToParts(now);
    const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    if (!raw || raw === "GMT") return "UTC+00:00";
    return raw.replace(/^GMT/, "UTC");
  } catch {
    return "";
  }
}

/** Giờ hiện tại ở múi giờ đó dạng `14:30`, giúp người dùng đối chiếu nhanh. */
export function formatTimezoneTime(zone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
  } catch {
    return "";
  }
}

/** Tên dễ đọc cho một múi giờ IANA, ví dụ `Asia/Ho_Chi_Minh` -> `Ho Chi Minh (Asia)`. */
export function formatTimezoneName(zone: string): string {
  const parts = zone.split("/");
  if (parts.length < 2) return zone.replaceAll("_", " ");
  const region = parts[0];
  const city = parts.slice(1).join(" / ").replaceAll("_", " ");
  return `${city} (${region})`;
}
