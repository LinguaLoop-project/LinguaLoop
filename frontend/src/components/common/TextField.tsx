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
          <label htmlFor={id} className="text-[13px] font-semibold text-text">
            {label}
          </label>
          {labelAside}
        </div>
        <div
          className={`relative flex h-11 items-center rounded-md border bg-surface px-3.5 text-text transition-colors duration-150 focus-within:ring-2 ${
            error
              ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
              : "border-border focus-within:border-primary focus-within:ring-primary/20"
          }`}
        >
          {icon && <Icon name={icon} className="mr-2.5 text-lg text-text-subtle" />}
          <input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? messageId : undefined}
            className={`h-full w-full border-0 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle ${className}`}
            {...props}
          />
          {trailing}
        </div>
        {below}
        {error ? (
          <p id={messageId} className="mt-0.5 flex items-center gap-1 text-xs font-medium text-danger">
            <Icon name="circle-alert" />
            <span>{error}</span>
          </p>
        ) : (
          hint && (
            <p id={messageId} className="mt-0.5 text-xs leading-normal text-text-muted">
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
            className="shrink-0 cursor-pointer border-0 bg-transparent p-1 text-lg text-text-subtle transition-colors hover:text-text"
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
