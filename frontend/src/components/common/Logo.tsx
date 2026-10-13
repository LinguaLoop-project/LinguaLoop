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
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={`ll-g-${id}`} x1="20" y1="88" x2="80" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ll-s1, #8b5cf6)" />
          <stop offset="0.55" stopColor="var(--ll-s2, #c084fc)" />
          <stop offset="1" stopColor="var(--ll-s3, #f0abfc)" />
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
    <span className={`inline-flex items-center gap-[0.35em] no-underline select-none ${className}`} role="img" aria-label="LinguaLoop">
      <LogoMark size={size} variant={variant} />
      {showText && (
        <span
          className="font-display font-bold tracking-[-0.035em] leading-none text-text"
          style={{ fontSize: size * 0.78 }}
        >
          Lingua<span className="bg-gradient-primary bg-clip-text text-transparent">Loop</span>
        </span>
      )}
    </span>
  );
}
