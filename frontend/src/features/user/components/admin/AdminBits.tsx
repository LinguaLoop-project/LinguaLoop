import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import type { AccountRole } from "../../types";

/** Thành phần nhỏ dùng chung giữa các màn quản trị tài khoản và giao lại nội dung. */

const ROLE_VARIANT: Record<AccountRole, string> = { student: "info", teacher: "accent", admin: "primary" };

export function RoleBadge({ role }: Readonly<{ role: AccountRole }>) {
  const { t } = useTranslation("userAdmin");
  return <Badge variant={ROLE_VARIANT[role]}>{t(`roles.${role}`)}</Badge>;
}

/** Trạng thái kèm icon để không chỉ dựa vào màu. */
export function StatusBadge({ locked }: Readonly<{ locked: boolean }>) {
  const { t } = useTranslation("userAdmin");
  return (
    <Badge variant={locked ? "danger" : "success"}>
      <Icon name={locked ? "lock" : "circle-check"} className="size-3" />
      {t(locked ? "status.locked" : "status.active")}
    </Badge>
  );
}

export interface FilterSelectProps {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

/** Ô chọn lọc có icon đầu; viền tô màu khi đang lọc. */
export function FilterSelect({ icon, label, value, onChange, children }: Readonly<FilterSelectProps>) {
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

/** Chữ cái đầu của tên làm ảnh đại diện khi tài khoản chưa có ảnh. */
export function Avatar({ name, url, size = "md" }: Readonly<{ name: string; url?: string | null; size?: "md" | "lg" }>) {
  const box = size === "lg" ? "size-14 text-xl" : "size-9 text-sm";
  if (url) return <img src={url} alt="" className={`${box} shrink-0 rounded-full object-cover`} />;
  return (
    <span
      aria-hidden
      className={`${box} grid shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary-text`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
