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
}

const Badge = ({ variant = "default", tone, children, className = "" }: BadgeProps) => {
  const getVariantClasses = () => {
    const key = variant?.toString().toUpperCase() || "DEFAULT";

    switch (key) {
      case "PRO":
        return "bg-[var(--btn-primary)] text-white border border-transparent font-bold";

      // ── CEFR Difficulty Levels ──
      case "A1":
      case "A2":
      case "BEGINNER":
        return "bg-[color-mix(in_srgb,var(--success)_24%,var(--bg-base))] text-success border border-success/60 font-black";

      case "B1":
      case "B2":
      case "INTERMEDIATE":
      case "MID":
        return "bg-[color-mix(in_srgb,var(--info)_24%,var(--bg-base))] text-info border border-info/60 font-black";

      case "C1":
      case "C2":
      case "ADVANCED":
      case "ADV":
        return "bg-[color-mix(in_srgb,var(--accent-2)_24%,var(--bg-base))] text-accent-2 border border-accent-2/60 font-black";

      case "SUCCESS":
        return "bg-[color-mix(in_srgb,var(--success)_20%,var(--bg-base))] text-success border border-success/40";
      case "WARNING":
        return "bg-[color-mix(in_srgb,var(--warning)_20%,var(--bg-base))] text-warning border border-warning/40";
      case "DANGER":
        return "bg-[color-mix(in_srgb,var(--danger)_20%,var(--bg-base))] text-danger border border-danger/40";
      case "INFO":
        return "bg-[color-mix(in_srgb,var(--info)_20%,var(--bg-base))] text-info border border-info/40";
      case "PRIMARY":
        return "bg-[color-mix(in_srgb,var(--primary)_20%,var(--bg-base))] text-accent border border-primary/40";
      case "ACCENT":
        return "bg-[color-mix(in_srgb,var(--accent-2)_20%,var(--bg-base))] text-accent-2 border border-accent-2/40";
      default:
        return tone 
          ? `bg-[color-mix(in_srgb,var(--${tone})_20%,var(--bg-base))] text-[var(--${tone})] border border-[var(--${tone})]/40`
          : "bg-[color-mix(in_srgb,var(--bg-base)_80%,transparent)] text-text border border-border backdrop-blur-md";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 h-[26px] px-2.5 rounded-md text-xs tracking-[0.06em] whitespace-nowrap backdrop-blur-md ${getVariantClasses()} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
