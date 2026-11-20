/** Định dạng ngày, tiền, số theo ngôn ngữ giao diện cho màn quản trị tài khoản. */

function locale(language: string): string {
  return language.startsWith("en") ? "en-GB" : "vi-VN";
}

export function formatDate(iso: string | null, language: string): string | null {
  return iso ? new Date(iso).toLocaleDateString(locale(language), { dateStyle: "medium" }) : null;
}

export function formatDateTime(iso: string | null, language: string): string | null {
  return iso ? new Date(iso).toLocaleString(locale(language), { dateStyle: "short", timeStyle: "short" }) : null;
}

export function formatVnd(amount: number, language: string): string {
  return new Intl.NumberFormat(locale(language), { style: "currency", currency: "VND" }).format(amount);
}

export function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(locale(language)).format(value);
}
