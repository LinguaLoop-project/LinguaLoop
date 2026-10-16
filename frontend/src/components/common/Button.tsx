import React, { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { buttonClasses, type ButtonFn, type ButtonSize, type ButtonVariant } from "./buttonStyles";

export type { ButtonFn, ButtonSize, ButtonVariant };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Chức năng cho variant "fn" (nền theo màu chức năng). */
  fn?: ButtonFn;
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
      fn,
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

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={buttonClasses({ variant, fn, size, iconOnly, fullWidth, className })}
        {...props}
      >
        {isLoading ? (
          <>
            <Icon name="loader-circle" className="animate-spin" />
            <span>{t("processing")}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
