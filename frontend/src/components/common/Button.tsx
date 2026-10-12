import React, { forwardRef } from "react";
import { useTranslation } from "react-i18next";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "text" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  iconOnly?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      iconOnly = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation();

    // Base styling
    const baseClasses =
      "inline-flex items-center justify-center font-body font-semibold select-none rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:transform-none disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

    // Size styling
    let sizeClasses = "gap-2 h-11 px-4.5 text-[15px]";
    if (size === "sm") {
      sizeClasses = "gap-1.5 h-9 px-3 text-sm";
    } else if (size === "lg") {
      sizeClasses = "gap-2.5 h-[52px] px-6 text-base";
    }

    if (iconOnly) {
      if (size === "sm") {
        sizeClasses = "w-9 h-9 p-0 text-base";
      } else if (size === "lg") {
        sizeClasses = "w-[50px] h-[50px] p-0 text-xl";
      } else {
        sizeClasses = "w-11 h-11 p-0 text-lg";
      }
    }

    // Variant styling
    let variantClasses = "";
    switch (variant) {
      case "primary":
        variantClasses =
          "bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)] text-white shadow-[0_2px_12px_color-mix(in_srgb,var(--btn-primary)_35%,transparent)] hover:shadow-[0_4px_16px_color-mix(in_srgb,var(--btn-primary)_45%,transparent)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";
        break;
      case "secondary":
        variantClasses =
          "bg-surface-hover hover:bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-text border border-border-strong hover:border-primary hover:text-white hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";
        break;
      case "ghost":
        variantClasses =
          "bg-transparent hover:bg-surface-hover text-text-muted hover:text-text border border-border hover:border-border-strong hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";
        break;
      case "text":
        variantClasses =
          "bg-transparent hover:bg-surface-hover/50 text-text-muted hover:text-text border-0";
        break;
      case "danger":
        variantClasses =
          "bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] hover:bg-danger text-danger hover:text-white border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";
        break;
    }

    const fullClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={[
          baseClasses,
          sizeClasses,
          variantClasses,
          fullClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{t("processing")}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0 items-center transition-transform group-hover:translate-x-1">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
