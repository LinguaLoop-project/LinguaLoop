import React, { forwardRef } from "react";
import Icon from "@/components/common/Icon";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

/** Ô chọn theo mockup v2 (`.check`): ô 20px bo 6, viền 1.5px, chọn thì nền primary + dấu tích trắng. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, containerClassName = "", className = "", id, ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1 ${containerClassName} ${className}`.trim()}>
        <label className="relative flex cursor-pointer select-none items-start gap-2.5 text-sm leading-normal text-text">
          <input ref={ref} id={id} type="checkbox" className="peer absolute h-5 w-5 opacity-0" {...props} />
          <span
            className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-[1.5px] text-transparent transition-colors duration-150 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
              error ? "border-danger" : "border-border-strong"
            }`}
          >
            <Icon name="check" className="text-sm" strokeWidth={3} />
          </span>
          {label && <span>{label}</span>}
        </label>
        {error && <p className="pl-[30px] text-[13px] font-medium text-danger">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
