import React from "react";

export interface ChipProps {
  id?: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  count?: number | string;
}

/** `.chip` của mockup: cao 32, bo tròn, viền border-strong; hover/đang chọn viền primary + nền primary-soft. */
const Chip = ({ id, children, active = false, onClick, className = "", count }: ChipProps) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex h-8 flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm text-text transition-colors duration-150 hover:border-primary hover:bg-primary-soft ${
      active ? "border-primary bg-primary-soft" : "border-border-strong bg-surface"
    } ${className}`}
  >
    {children}
    {count !== undefined && <small className="font-semibold text-text-subtle">{count}</small>}
  </button>
);

export default Chip;
