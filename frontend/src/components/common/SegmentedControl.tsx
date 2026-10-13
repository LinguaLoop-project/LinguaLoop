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

const SegmentedControl = ({
  id,
  options,
  value,
  onChange,
  className = "",
  ariaLabel,
}: SegmentedControlProps) => {
  return (
    <div
      id={id}
      className={`relative inline-flex p-1 gap-0.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`relative z-10 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
            value === option.value
              ? "text-[var(--text)] bg-[var(--primary-soft)] shadow-[inset_0_0_0_1px_var(--border-strong)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
          aria-pressed={value === option.value}
        >
          {option.icon && <span className="text-lg">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
