/** Ngày theo ngôn ngữ giao diện, vd 20/12/2026 hoặc 20 Dec 2026. */
export function formatDay(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(language.startsWith("en") ? "en-GB" : "vi-VN", { dateStyle: "medium" });
}

/** Ngày giờ ngắn theo ngôn ngữ giao diện. */
export function formatMoment(iso: string, language: string): string {
  return new Date(iso).toLocaleString(language.startsWith("en") ? "en-GB" : "vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
