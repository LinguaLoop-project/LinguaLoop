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

/** `.form-alert` của mockup: nền tone 12%, viền tone 35%, icon 20px cùng màu tone. */
const TONE: Record<FormAlertVariant, { box: string; icon: string }> = {
  success: { box: "[--tone:var(--success)]", icon: "circle-check" },
  danger: { box: "[--tone:var(--danger)]", icon: "circle-alert" },
  warning: { box: "[--tone:var(--warning)]", icon: "triangle-alert" },
  info: { box: "[--tone:var(--info)]", icon: "info" },
};

export const FormAlert: React.FC<FormAlertProps> = ({
  variant = "danger",
  icon,
  children,
  className = "",
  role = variant === "success" ? "status" : "alert",
}) => (
  <div
    role={role}
    className={`flex items-start gap-2.5 rounded-md border border-[color-mix(in_srgb,var(--tone)_35%,transparent)] bg-[color-mix(in_srgb,var(--tone)_12%,transparent)] px-3.5 py-3 text-sm leading-normal text-text ${TONE[variant].box} ${className}`}
  >
    <span className="shrink-0 text-xl text-[var(--tone)]">{icon ?? <Icon name={TONE[variant].icon} />}</span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

export default FormAlert;
