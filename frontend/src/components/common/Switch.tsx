export interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
}

/** Nút gạt bật/tắt (role="switch") cho các tùy chọn nhị phân trong Cài đặt. */
export default function Switch({
  id,
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  className = "",
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-primary bg-primary"
          : "border-border-strong bg-bg-elevated hover:border-primary/50"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none block size-4.5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-[var(--ease-out)] ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
