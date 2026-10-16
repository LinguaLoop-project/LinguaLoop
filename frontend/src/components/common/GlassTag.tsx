import React from "react";

export interface GlassTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const GlassTag: React.FC<GlassTagProps> = ({
  children,
  title,
  className = "",
  ...props
}) => {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-md font-body font-semibold text-[13px] text-text bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] backdrop-blur-md border border-border ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default GlassTag;
