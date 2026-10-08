/** Điểm độ mạnh 1–4 cho thanh đo mật khẩu (0 khi chưa nhập). Chỉ gợi ý hiển thị, không thay cho validate. */
export function getPwScore(v: string): number {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/i.test(v) && /\d/.test(v)) s++;
  if (/[^a-z0-9]/i.test(v)) s++;
  if (v.length >= 12) s++;
  return Math.max(1, s);
}

export function isPwValid(v: string): boolean {
  return v.length >= 8;
}
