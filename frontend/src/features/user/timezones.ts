/** Múi giờ của thiết bị; trình duyệt không cho biết thì trả `null`. */
export function detectTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

const FALLBACK_ZONES = ["Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Singapore", "Asia/Tokyo", "Asia/Seoul", "Europe/London", "America/New_York", "America/Los_Angeles", "Australia/Sydney", "UTC"];

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
