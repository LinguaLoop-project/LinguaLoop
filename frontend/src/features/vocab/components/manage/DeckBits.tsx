import type { ReactNode } from "react";
import Icon from "@/components/common/Icon";

/** Thành phần nhỏ dùng chung giữa danh sách bộ và trang bộ: nhãn trạng thái, chip thông tin, ô chọn có icon. */

export type DeckStatusKey = "published" | "draft" | "deleted";

const STATUS_STYLE: Record<DeckStatusKey, { icon: string; className: string }> = {
  published: { icon: "circle-check", className: "text-success bg-[color-mix(in_srgb,var(--success)_14%,transparent)]" },
  draft: { icon: "pencil-line", className: "text-warning bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]" },
  deleted: { icon: "trash-2", className: "text-danger bg-[color-mix(in_srgb,var(--danger)_14%,transparent)]" },
};

/** Nhãn trạng thái kèm icon để phân biệt nhanh, không chỉ dựa vào màu. */
export function StatusBadge({ status, label }: Readonly<{ status: DeckStatusKey; label: string }>) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}
    >
      <Icon name={style.icon} className="size-3.5" />
      {label}
    </span>
  );
}

export function MetaChip({ icon, children }: Readonly<{ icon: string; children: ReactNode }>) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-bg-elevated px-2 py-0.5">
      <Icon name={icon} className="size-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export interface FilterSelectProps {
  icon: string;
  label: string;
  value: string;
  /** Đang khác mặc định: tô viền để người dùng thấy bộ lọc nào đang bật. */
  active?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}

/** Ô chọn có icon đầu và mũi tên riêng thay mũi tên mặc định của trình duyệt. */
export function FilterSelect({ icon, label, value, active = false, onChange, children }: Readonly<FilterSelectProps>) {
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

/** Checkbox dạng nút bật/tắt có icon; checkbox thật được ẩn nên bàn phím và trình đọc màn hình vẫn dùng như cũ. */
export function ToggleChip({
  icon,
  label,
  checked,
  onChange,
}: Readonly<{ icon: string; label: string; checked: boolean; onChange: (checked: boolean) => void }>) {
  return (
    <label className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-muted transition-colors hover:border-border-strong has-[:checked]:border-warning has-[:checked]:bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] has-[:checked]:text-warning has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <Icon name={icon} />
      {label}
    </label>
  );
}
