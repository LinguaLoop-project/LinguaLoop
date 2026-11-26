import type { ReactNode } from "react";
import Icon from "@/components/common/Icon";

export type SettingsCardTone = "primary" | "dictation" | "shadowing" | "watch" | "neutral";

const ICON_TONE: Record<SettingsCardTone, string> = {
  primary: "bg-primary-soft text-primary-text",
  dictation: "bg-fn-dictation-soft text-fn-dictation",
  shadowing: "bg-fn-shadowing-soft text-fn-shadowing",
  watch: "bg-fn-watch-soft text-fn-watch",
  neutral: "bg-bg-elevated text-text-muted",
};

export interface SettingsCardProps {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  tone?: SettingsCardTone;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Khung thẻ thống nhất cho mọi mục trong trang Cài đặt. */
export function SettingsCard({
  id,
  title,
  description,
  icon,
  tone = "primary",
  action,
  children,
  className = "",
}: SettingsCardProps) {
  const hasHeader = Boolean(title || description || icon || action);
  return (
    <section
      id={id}
      className={`flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6 ${className}`}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {icon && (
              <span
                aria-hidden="true"
                className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md ${ICON_TONE[tone]}`}
              >
                <Icon name={icon} className="text-lg" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              {title && <h3 className="text-base font-bold leading-snug text-text sm:text-lg">{title}</h3>}
              {description && <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export interface SettingRowProps {
  label: string;
  hint?: string;
  labelId?: string;
  htmlFor?: string;
  /** Xếp dọc (label trên, control dưới) khi control rộng như bộ chọn thẻ trực quan. */
  stacked?: boolean;
  children: ReactNode;
}

/** Hàng tùy chọn hai cột (nhãn + mô tả bên trái, điều khiển bên phải) trên màn hình rộng. */
export function SettingRow({ label, hint, labelId, htmlFor, stacked = false, children }: SettingRowProps) {
  const labelNode = htmlFor ? (
    <label id={labelId} htmlFor={htmlFor} className="text-sm font-semibold text-text">
      {label}
    </label>
  ) : (
    <span id={labelId} className="text-sm font-semibold text-text">
      {label}
    </span>
  );

  if (stacked) {
    return (
      <div className="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0">
        <div className="flex flex-col gap-0.5">
          {labelNode}
          {hint && <p className="text-[13px] leading-relaxed text-text-subtle">{hint}</p>}
        </div>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        {labelNode}
        {hint && <p className="mt-0.5 text-[13px] leading-relaxed text-text-subtle">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
