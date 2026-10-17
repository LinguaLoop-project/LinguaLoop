export type ButtonVariant = "primary" | "fn" | "secondary" | "ghost" | "text" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
/** Màu chức năng (DESIGN.v2 §2.2) dùng cho variant "fn". */
export type ButtonFn = "dictation" | "shadowing" | "vocab" | "assessment";

/** Giá trị lấy từ mockup v2 (`.btn` trong app.css): cao 44, bo md, viền 1px, đáy 3px, nhấn thì đáy nén xuống. */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md border font-semibold whitespace-nowrap select-none cursor-pointer no-underline " +
  "transition-[background-color,border-color,transform,box-shadow] duration-150 active:translate-y-[3px] " +
  "disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-[18px] text-[15px]",
  lg: "h-[52px] px-7 text-base",
};

/** Nút chỉ có icon: 40×40 như `.btn.icon` của mockup. */
const ICON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 w-9 p-0 text-base",
  md: "h-10 w-10 p-0 text-lg",
  lg: "h-[50px] w-[50px] p-0 text-xl",
};

const shadow = (colorVar: string, pct = 55) => `shadow-[0_3px_0_color-mix(in_srgb,var(${colorVar})_${pct}%,#000)] active:shadow-none`;

const VARIANTS: Record<Exclude<ButtonVariant, "fn">, string> = {
  primary: `bg-[var(--btn-primary)] border-transparent text-white hover:bg-[var(--btn-primary-hover)] ${shadow("--btn-primary")}`,
  secondary: "bg-surface border-border-strong text-text hover:bg-surface-hover",
  ghost: "bg-transparent border-border-strong text-text hover:bg-surface-hover",
  text: "!h-auto !px-1.5 py-1 bg-transparent border-transparent text-primary-text hover:bg-surface-hover active:!translate-y-0",
  danger: `bg-danger border-transparent text-white hover:brightness-110 ${shadow("--danger", 60)}`,
};

const FN: Record<ButtonFn, string> = {
  dictation: `bg-fn-dictation border-transparent text-on-fn hover:bg-[color-mix(in_srgb,var(--fn-dictation)_88%,#fff)] ${shadow("--fn-dictation", 60)}`,
  shadowing: `bg-fn-shadowing border-transparent text-on-fn hover:bg-[color-mix(in_srgb,var(--fn-shadowing)_88%,#fff)] ${shadow("--fn-shadowing", 60)}`,
  vocab: `bg-fn-vocab border-transparent text-on-fn hover:bg-[color-mix(in_srgb,var(--fn-vocab)_88%,#fff)] ${shadow("--fn-vocab", 60)}`,
  assessment: `bg-fn-assessment border-transparent text-on-fn hover:bg-[color-mix(in_srgb,var(--fn-assessment)_88%,#fff)] ${shadow("--fn-assessment", 60)}`,
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  fn?: ButtonFn;
  size?: ButtonSize;
  iconOnly?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/** Class của nút, để `<Link>` và `<a>` có đúng giao diện nút mà không phải lồng `<button>`. */
export function buttonClasses({
  variant = "primary",
  fn = "dictation",
  size = "md",
  iconOnly = false,
  fullWidth = false,
  className = "",
}: ButtonStyleOptions = {}): string {
  const variantClass = variant === "fn" ? FN[fn] : VARIANTS[variant];
  return [BASE, iconOnly ? ICON_SIZES[size] : SIZES[size], variantClass, fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}
