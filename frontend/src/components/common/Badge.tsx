import React from "react";

export type BadgeVariant =
  | "default"
  | "pro"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary"
  | "accent"
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2"
  | (string & {});

export type BadgeTone = "success" | "warning" | "danger" | "info" | "primary" | "accent";

export interface BadgeProps {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  /** Nền tối đặc có viền màu, dùng trên ảnh bìa để dễ đọc. */
  solid?: boolean;
}

/** Màu của huy hiệu: chữ theo `--_c`, nền là `--_c` pha 14% (`.badge` trong mockup v2). Class viết nguyên văn để Tailwind nhận ra. */
const TONE = {
  success: "[--_c:var(--success)]",
  info: "[--_c:var(--info)]",
  accent: "[--_c:var(--accent-2)]",
  warning: "[--_c:var(--warning)]",
  danger: "[--_c:var(--danger)]",
  primary: "[--_c:var(--primary-text)]",
  muted: "[--_c:var(--text-muted)]",
} as const;

function toneOf(variant: string, tone?: BadgeTone) {
  switch (variant.toUpperCase()) {
    case "A1":
    case "A2":
    case "BEGINNER":
    case "SUCCESS":
      return TONE.success;
    case "B1":
    case "B2":
    case "INTERMEDIATE":
    case "MID":
    case "INFO":
      return TONE.info;
    case "C1":
    case "C2":
    case "ADVANCED":
    case "ADV":
    case "ACCENT":
      return TONE.accent;
    case "PRO":
    case "WARNING":
      return TONE.warning;
    case "DANGER":
      return TONE.danger;
    case "PRIMARY":
      return TONE.primary;
    default:
      return tone ? TONE[tone === "accent" ? "accent" : tone] : TONE.muted;
  }
}

const Badge = ({ variant = "default", tone, children, className = "", solid = false }: BadgeProps) => (
  <span
    className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-sm px-2 text-xs font-bold text-[var(--_c)] ${
      solid ? "border border-[var(--_c)] bg-[#0B0B14]/90 shadow-[0_1px_4px_rgba(0,0,0,.4)]" : "bg-[color-mix(in_srgb,var(--_c)_14%,transparent)] font-semibold"
    } [&>svg]:h-3.5 [&>svg]:w-3.5 ${toneOf(String(variant), tone)} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
