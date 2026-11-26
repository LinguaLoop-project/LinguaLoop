import type { ReactNode } from "react";
import Icon from "./Icon";

export interface FilterSelectProps {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

/** Ô chọn lọc có icon đầu; viền tô màu khi đang lọc. Dùng chung cho các danh sách quản trị. */
export default function FilterSelect({ icon, label, value, onChange, children }: Readonly<FilterSelectProps>) {
  const active = value !== "";
  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 ${active ? "text-primary" : "text-text-subtle"}`}
      >
        <Icon name={icon} />
      </span>
      <select
        aria-label={label}
        title={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 cursor-pointer appearance-none rounded-md border bg-surface pl-9 pr-9 text-sm text-text transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-primary ${
          active ? "border-primary" : "border-border"
        }`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 text-text-subtle">
        <Icon name="chevron-down" />
      </span>
    </div>
  );
}
