import React, { forwardRef } from "react";
import Icon from "@/components/common/Icon";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, containerClassName = "", className = "", id, ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1 ${containerClassName} ${className}`.trim()}>
        <label className="inline-flex items-start gap-2.5 text-sm text-text-muted cursor-pointer select-none">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="sr-only peer"
            {...props}
          />
          <span className="w-4.5 h-4.5 rounded-sm border border-border-strong bg-surface-glass grid place-items-center text-xs text-white transition-colors peer-checked:bg-primary peer-checked:border-primary shrink-0 mt-0.5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
            <Icon name="check" className="hidden peer-checked:block" />
          </span>
          {label && <span className="leading-snug">{label}</span>}
        </label>
        {error && <p className="text-xs font-medium text-danger pl-7">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
