import React from "react";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  id?: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

/** `.seg` của mockup: khay bo md, nút cao 36; nút đang chọn nền primary-soft + viền trong border-strong. */
const SegmentedControl = ({ id, options, value, onChange, className = "", ariaLabel }: SegmentedControlProps) => (
  <div
    id={id}
    role="group"
    aria-label={ariaLabel}
    className={`inline-flex gap-0.5 rounded-md border border-border bg-surface p-1 ${className}`}
  >
    {options.map((option) => {
      const on = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={on}
          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-sm border-0 px-3.5 transition-colors duration-150 ${
            on
              ? "bg-primary-soft font-semibold text-text shadow-[inset_0_0_0_1px_var(--border-strong)]"
              : "bg-transparent font-medium text-text-muted hover:text-text"
          }`}
        >
          {option.icon && <span className="text-lg">{option.icon}</span>}
          {option.label}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
