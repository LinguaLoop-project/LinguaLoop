import type { ReactNode } from "react";
import Icon from "@/components/common/Icon";

export interface SectionHeadingProps {
  /** Tên icon Lucide (hoặc tên từ backend, đã có alias). */
  icon?: string | null;
  fallbackIcon?: string;
  title: ReactNode;
  /** Chữ nhỏ cạnh tiêu đề, vd "12 bài". */
  count?: ReactNode;
  /** Phần bên phải: liên kết, nút, gợi ý. */
  aside?: ReactNode;
  className?: string;
}

/** Tiêu đề một khối nội dung: ô icon + tên + số lượng, kèm phần bên phải tuỳ chọn. */
export default function SectionHeading({ icon, fallbackIcon = "hash", title, count, aside, className = "" }: SectionHeadingProps) {
  return (
    <div className={`mb-4 flex flex-wrap items-end justify-between gap-3 sm:gap-4 ${className}`}>
      <h2 className="flex items-center font-display text-xl font-bold text-text sm:text-2xl">
        {icon !== undefined && (
          <span className="mr-2.5 inline-grid h-8 w-8 place-items-center rounded-md bg-primary-soft align-middle text-lg text-primary-text">
            <Icon name={icon} fallback={fallbackIcon} />
          </span>
        )}
        {title}
        {count && <small className="ml-2 text-xs font-medium text-text-muted sm:text-sm">{count}</small>}
      </h2>
      {aside}
    </div>
  );
}
