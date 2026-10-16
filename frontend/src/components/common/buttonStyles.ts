export type ButtonVariant = "primary" | "fn" | "secondary" | "ghost" | "text" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
/** Màu chức năng (DESIGN.v2 §2.2) dùng cho variant "fn". */
export type ButtonFn = "dictation" | "shadowing" | "vocab" | "assessment";

const BASE =
  "inline-flex items-center justify-center font-body font-semibold select-none rounded-md transition-[background-color,border-color,color,transform,box-shadow] duration-150 cursor-pointer no-underline disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const SIZES: Record<ButtonSize, string> = {
  sm: "gap-1.5 h-9 px-3 text-sm",
  md: "gap-2 h-11 px-4.5 text-[15px]",
  lg: "gap-2.5 h-[52px] px-6 text-base",
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: "w-9 h-9 p-0 text-base",
  md: "w-11 h-11 p-0 text-lg",
  lg: "w-[50px] h-[50px] p-0 text-xl",
};

/** Nút "nổi" có đáy dày 4px; nhấn thì đáy nén xuống (DESIGN.v2 §7.1). */
const RAISED = "active:translate-y-[3px]";

const VARIANTS: Record<Exclude<ButtonVariant, "fn">, string> = {
  primary: `bg-[var(--btn-primary)] text-white hover:brightness-110 shadow-[0_4px_0_color-mix(in_srgb,var(--btn-primary)_68%,black)] active:shadow-[0_1px_0_color-mix(in_srgb,var(--btn-primary)_68%,black)] ${RAISED}`,
  secondary:
    "bg-surface text-text border border-border-strong hover:bg-surface-hover active:scale-[0.98]",
  ghost:
    "bg-transparent text-text-muted hover:text-text hover:bg-surface-hover border border-border hover:border-border-strong active:scale-[0.98]",
  text: "bg-transparent text-text-muted hover:text-text hover:bg-surface-hover border-0",
  danger:
    "bg-danger/15 text-danger border border-danger/30 hover:bg-danger hover:text-white active:scale-[0.98]",
};

const FN: Record<ButtonFn, string> = {
  dictation: `bg-fn-dictation text-on-fn hover:brightness-110 shadow-[0_4px_0_color-mix(in_srgb,var(--fn-dictation)_65%,black)] active:shadow-[0_1px_0_color-mix(in_srgb,var(--fn-dictation)_65%,black)] ${RAISED}`,
  shadowing: `bg-fn-shadowing text-on-fn hover:brightness-110 shadow-[0_4px_0_color-mix(in_srgb,var(--fn-shadowing)_65%,black)] active:shadow-[0_1px_0_color-mix(in_srgb,var(--fn-shadowing)_65%,black)] ${RAISED}`,
  vocab: `bg-fn-vocab text-on-fn hover:brightness-110 shadow-[0_4px_0_color-mix(in_srgb,var(--fn-vocab)_65%,black)] active:shadow-[0_1px_0_color-mix(in_srgb,var(--fn-vocab)_65%,black)] ${RAISED}`,
  assessment: `bg-fn-assessment text-on-fn hover:brightness-110 shadow-[0_4px_0_color-mix(in_srgb,var(--fn-assessment)_65%,black)] active:shadow-[0_1px_0_color-mix(in_srgb,var(--fn-assessment)_65%,black)] ${RAISED}`,
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
