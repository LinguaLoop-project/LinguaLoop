import React from "react";
import Icon from "@/components/common/Icon";
import Button from "./Button";

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

/** `.empty` của mockup: không khung, căn giữa, mascot 120 (hoặc icon), h3 + mô tả nhỏ + nút ghost. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  mascotSrc = "/mascot/loopi-encourage.svg",
  title,
  description,
  actionText,
  onAction,
  children,
  className = "",
}) => (
  <div className={`flex flex-col items-center px-4 py-12 text-center ${className}`}>
    {mascotSrc ? (
      <img className="mb-3 h-[120px] w-[120px] select-none" src={mascotSrc} width={120} height={120} alt="" draggable={false} />
    ) : icon ? (
      <div className="mb-3 grid h-16 w-16 place-items-center rounded-lg border border-border bg-primary-soft text-3xl text-primary-text">
        <Icon name={icon} />
      </div>
    ) : null}
    <h3 className="text-lg font-bold">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-[13px] leading-normal text-text-muted">{description}</p>}
    {actionText && onAction && (
      <Button variant="ghost" className="mt-4" onClick={onAction}>
        {actionText}
      </Button>
    )}
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export default EmptyState;
