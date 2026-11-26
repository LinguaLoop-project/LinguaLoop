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

/** Ô chọn lọc đã chuyển sang components/common để các màn quản trị khác dùng chung. */
export { default as FilterSelect } from "@/components/common/FilterSelect";

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
