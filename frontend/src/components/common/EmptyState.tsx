import React from "react";
import Icon from "@/components/common/Icon";

export interface EmptyStateProps {
  icon?: string;
  mascotSrc?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  mascotSrc = "/mascot/loopi-encourage.svg",
  title,
  description,
  actionText,
  onAction,
  children,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 gap-3 rounded-2xl border border-dashed border-border-strong bg-surface/50 text-text-muted ${className}`}
    >
      {mascotSrc ? (
        <img
          className="w-24 h-24 mb-1 select-none pointer-events-none"
          src={mascotSrc}
          width={96}
          height={96}
          alt="Loopi"
          draggable={false}
        />
      ) : icon ? (
        <div className="w-16 h-16 rounded-2xl grid place-items-center text-3xl bg-primary-soft text-accent border border-border mb-1">
          <Icon name={icon} />
        </div>
      ) : null}

      <h3 className="font-semibold text-lg text-text">{title}</h3>

      {description && (
        <p className="text-sm text-text-muted max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border border-border bg-transparent hover:bg-surface-hover text-text text-sm font-semibold transition-colors duration-150 cursor-pointer"
        >
          {actionText}
        </button>
      )}

      {children}
    </div>
  );
};

export default EmptyState;
