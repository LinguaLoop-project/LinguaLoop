import React, { forwardRef, useState } from "react";
import Icon from "./Icon";

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  /** Tên icon Lucide ở đầu ô nhập. */
  icon?: string;
  /** Thông báo lỗi; khi có thì thay phần `hint`. */
  error?: string;
  hint?: React.ReactNode;
  /** Đặt cùng hàng với nhãn, ví dụ liên kết "Quên mật khẩu?". */
  labelAside?: React.ReactNode;
  /** Phần tử cuối ô nhập, ví dụ nút hiện mật khẩu. */
  trailing?: React.ReactNode;
  /** Nội dung đặt giữa ô nhập và dòng thông báo, ví dụ thanh độ mạnh mật khẩu. */
  below?: React.ReactNode;
  /** Nội dung đặt sau dòng thông báo, ví dụ liên kết gợi ý khi email đã tồn tại. */
  footer?: React.ReactNode;
}

/** Ô nhập chung: nhãn, icon, trạng thái lỗi/focus và thông báo theo token. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, icon, error, hint, labelAside, trailing, below, footer, className = "", ...props }, ref) => {
    const messageId = `${id}-msg`;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-semibold text-text">
            {label}
          </label>
          {labelAside}
        </div>
        <div
          className={`relative flex h-12 min-w-0 items-center gap-2.5 rounded-md border bg-surface px-3.5 text-text transition-[border-color,box-shadow] duration-150 focus-within:shadow-[0_0_0_3px_var(--primary-soft)] ${
            error
              ? "border-danger focus-within:border-danger focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_22%,transparent)]"
              : "border-border-strong focus-within:border-primary"
          }`}
        >
          {icon && <Icon name={icon} className="text-xl text-text-subtle" />}
          <input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? messageId : undefined}
            className={`h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] leading-[1.4] text-text outline-none placeholder:text-text-subtle ${className}`}
            {...props}
          />
          {trailing}
        </div>
        {below}
        {error ? (
          <p id={messageId} className="flex items-center gap-1.5 text-[13px] text-danger">
            <Icon name="circle-alert" />
            <span>{error}</span>
          </p>
        ) : (
          hint && (
            <p id={messageId} className="text-[13px] leading-normal text-text-subtle">
              {hint}
            </p>
          )
        )}
        {footer}
      </div>
    );
  },
);
TextField.displayName = "TextField";

export interface PasswordFieldProps extends Omit<TextFieldProps, "type" | "trailing" | "icon"> {
  showLabel: string;
  hideLabel: string;
  /** Truyền cả hai để nhiều ô dùng chung một trạng thái hiện/ẩn. */
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

/** Ô mật khẩu có nút hiện/ẩn; trạng thái có thể do bên ngoài điều khiển. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ showLabel, hideLabel, visible, onVisibleChange, ...props }, ref) => {
    const [inner, setInner] = useState(false);
    const shown = visible ?? inner;
    const toggle = () => (onVisibleChange ? onVisibleChange(!shown) : setInner(!shown));
    return (
      <TextField
        ref={ref}
        icon="lock"
        type={shown ? "text" : "password"}
        trailing={
          <button
            type="button"
            className="-mr-2 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-sm border-0 bg-transparent text-xl text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            onClick={toggle}
            aria-label={shown ? hideLabel : showLabel}
            aria-pressed={shown}
          >
            <Icon name={shown ? "eye-off" : "eye"} />
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordField.displayName = "PasswordField";

export default TextField;
