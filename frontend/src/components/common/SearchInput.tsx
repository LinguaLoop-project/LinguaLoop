import React from "react";

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
    <div
      id={id}
      className={`flex items-center gap-2.5 min-w-[220px] h-11 px-3.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] transition-colors duration-150 focus-within:border-[var(--primary)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--primary)] focus-within:outline-offset-2 ${className}`}
    >
      {icon || (
        <i className="ph ph-magnifying-glass text-lg text-[var(--text-muted)]" />
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
        className="flex-1 min-w-0 border-0 bg-none text-[15px] text-[var(--text)] focus:outline-none placeholder:text-[var(--text-subtle)]"
      />
    </div>
  );
};

export default SearchInput;
