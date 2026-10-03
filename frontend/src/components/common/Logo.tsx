// Logo LinguaLoop — "Bong bóng lặp"
// Dùng: <Logo />  ·  <Logo size={28} showText={false} />  ·  <Logo variant="favicon" />
// Màu tự đổi theo theme qua CSS variables trong DESIGN.md (--text) và thuộc tính data-theme.

import { useId } from "react";

export type LogoProps = {
  size?: number; // chiều cao biểu tượng (px)
  showText?: boolean; // hiện chữ "LinguaLoop"
  variant?: "full" | "favicon"; // favicon = bản rút gọn cho cỡ ≤ 24px
  className?: string;
};

const ARC = "M24 88 L34 73.7 A32 32 0 1 1 66 73.7";
const HEAD = "M79.8 76.1 L66 73.7 L70.8 60.5";
const BARS = "M37 39 V53 M50 32 V60 M63 38 V54";

export function LogoMark({ size = 32, variant = "full" }: Pick<LogoProps, "size" | "variant">) {
  const id = useId().replace(/:/g, "");
  const small = variant === "favicon" || size <= 24;
  const sw = small ? 13 : size <= 48 ? 10 : 8;
  const bw = small ? 11 : size <= 48 ? 9 : 7;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" className="ll-mark">
      <defs>
        <linearGradient id={`ll-g-${id}`} x1="20" y1="88" x2="80" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" className="ll-stop-1" />
          <stop offset="0.55" className="ll-stop-2" />
          <stop offset="1" className="ll-stop-3" />
        </linearGradient>
      </defs>
      <path d={ARC} stroke={`url(#ll-g-${id})`} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      {!small && (
        <path d={HEAD} stroke={`url(#ll-g-${id})`} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      )}
      <path d={small ? "M38 41 V51 M50 35 V57 M62 41 V51" : BARS} stroke="var(--text)" strokeWidth={bw} strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ size = 32, showText = true, variant = "full", className = "" }: LogoProps) {
  return (
    <span className={`ll-logo ${className}`} role="img" aria-label="LinguaLoop">
      <LogoMark size={size} variant={variant} />
      {showText && (
        <span className="ll-wordmark font-display" style={{ fontSize: size * 0.78 }}>
          Lingua<span className="ll-loop">Loop</span>
        </span>
      )}
    </span>
  );
}
