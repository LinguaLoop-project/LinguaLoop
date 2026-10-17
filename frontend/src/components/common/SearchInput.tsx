import React from "react";
import Icon from "@/components/common/Icon";

export interface SearchInputProps {
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
  autoComplete?: string;
}

/** Ô tìm `.search-v2` của mockup: cao 44, bo md, viền border-strong, icon bên trái. */
const SearchInput = ({
  id,
  placeholder = "Search...",
  value = "",
  onChange,
  onKeyDown,
  className = "",
  icon,
  ariaLabel = "Search",
  autoComplete = "off",
}: SearchInputProps) => {
  return (
    <div id={id} className={`relative min-w-[220px] flex-1 ${className}`}>
      <span className="pointer-events-none absolute left-3.5 top-3 text-xl text-text-subtle">
        {icon || <Icon name="search" />}
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-md border border-border-strong bg-surface pl-[42px] pr-3.5 text-text outline-none transition-colors placeholder:text-text-subtle focus:border-primary"
      />
    </div>
  );
};

export default SearchInput;
