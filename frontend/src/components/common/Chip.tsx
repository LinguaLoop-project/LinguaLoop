import React from "react";

export interface ChipProps {
  id?: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  count?: number | string;
  lift?: boolean;
}

const Chip = ({
  id,
  children,
  active = false,
  onClick,
  className = "",
  count,
  lift = false,
}: ChipProps) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-full text-[14.5px] font-medium border bg-[var(--surface-hover)] text-[var(--text-muted)] transition-all duration-250 ease-out";

  const activeClasses = active
    ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--text)]"
    : "border-[var(--border)]";

  const hoverClasses = onClick
    ? "hover:-translate-y-0.5 hover:border-[var(--primary)] hover:text-[var(--text)] cursor-pointer"
    : "";

  const liftClasses = lift ? "hover:-translate-y-0.5" : "";

  return (
    <button
      id={id}
      type="button"
      className={`${baseClasses} ${activeClasses} ${hoverClasses} ${liftClasses} ${onClick ? "min-h-9" : ""} ${className}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
      {count !== undefined && (
        <small className="text-[13px] font-semibold text-[var(--text-subtle)] ml-1">
          {count}
        </small>
      )}
    </button>
  );
};

export default Chip;
