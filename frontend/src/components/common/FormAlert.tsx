import React from "react";
import Icon from "@/components/common/Icon";

export type FormAlertVariant = "success" | "danger" | "warning" | "info";

export interface FormAlertProps {
  variant?: FormAlertVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
}

export const FormAlert: React.FC<FormAlertProps> = ({
  variant = "danger",
  icon,
  children,
  className = "",
  role = variant === "success" ? "status" : "alert",
}) => {
  let variantStyles = "";
  let defaultIcon = null;

  switch (variant) {
    case "success":
      variantStyles =
        "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success border-[color-mix(in_srgb,var(--success)_28%,transparent)]";
      defaultIcon = <Icon name="circle-check" className="text-xl shrink-0" />;
      break;
    case "danger":
      variantStyles =
        "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger border-[color-mix(in_srgb,var(--danger)_28%,transparent)]";
      defaultIcon = <Icon name="circle-alert" className="text-xl shrink-0" />;
      break;
    case "warning":
      variantStyles =
        "bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning border-[color-mix(in_srgb,var(--warning)_28%,transparent)]";
      defaultIcon = <Icon name="triangle-alert" className="text-xl shrink-0" />;
      break;
    case "info":
      variantStyles =
        "bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-info border-[color-mix(in_srgb,var(--info)_28%,transparent)]";
      defaultIcon = <Icon name="info" className="text-xl shrink-0" />;
      break;
  }

  return (
    <div
      role={role}
      className={`rounded-xl p-3.5 flex items-center gap-2.5 text-sm font-medium border leading-snug ${variantStyles} ${className}`}
    >
      {icon ?? defaultIcon}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default FormAlert;
