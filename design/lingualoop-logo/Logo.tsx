// Logo LinguaLoop — "Bong bóng lặp"
// Dùng: <Logo />  ·  <Logo size={28} showText={false} />  ·  <Logo variant="favicon" />
// Màu tự đổi theo theme qua CSS variables trong DESIGN.md (--text) và thuộc tính data-theme.

import { useId } from "react";

type LogoProps = {
  size?: number;          // chiều cao biểu tượng (px)
  showText?: boolean;     // hiện chữ "LinguaLoop"
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
        <span className="ll-wordmark" style={{ fontSize: size * 0.78 }}>
          Lingua<span className="ll-loop">Loop</span>
        </span>
      )}
    </span>
  );
}

/* ---- Thêm vào CSS toàn cục (globals.css) ----

.ll-logo { display: inline-flex; align-items: center; gap: 0.3em; }
.ll-wordmark {
  font-family: "Bricolage Grotesque", sans-serif;
  font-weight: 700; letter-spacing: -0.035em; line-height: 1;
  color: var(--text);
}
.ll-loop {
  background: linear-gradient(90deg, #A78BFA, #C084FC 50%, #F0ABFC);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ll-stop-1 { stop-color: #8B5CF6; }
.ll-stop-2 { stop-color: #C084FC; }
.ll-stop-3 { stop-color: #F0ABFC; }

:root[data-theme="light"] .ll-loop { background-image: linear-gradient(90deg, #7C3AED, #A855F7 55%, #DB2777); }
:root[data-theme="light"] .ll-stop-1 { stop-color: #6D28D9; }
:root[data-theme="light"] .ll-stop-2 { stop-color: #A855F7; }
:root[data-theme="light"] .ll-stop-3 { stop-color: #DB2777; }

.ll-logo:hover .ll-mark { transform: rotate(-8deg) scale(1.04); }
.ll-mark { transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1); }

---- Thẻ <head> (copy thư mục svg/ và png/ vào public/) ----

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/svg/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/png/apple-touch-icon.png">
<!-- manifest.json: dùng png/app-icon-192.png và png/app-icon-512.png -->
*/
