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

/** `.sec-head` của mockup: h2 24px kèm ô icon 36px (`.sec-ic`), cách trên 32 và dưới 16. */
export default function SectionHeading({ icon, fallbackIcon = "hash", title, count, aside, className = "" }: SectionHeadingProps) {
  return (
    <div className={`mb-4 mt-8 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="flex items-center gap-2.5 font-display text-xl font-bold leading-[1.3] tracking-[-0.01em] sm:text-2xl">
        {icon !== undefined && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-text">
            <Icon name={icon} fallback={fallbackIcon} className="h-5 w-5" />
          </span>
        )}
        <span>
          {title}
          {count && <small className="ml-2.5 text-[15px] font-normal text-text-muted">{count}</small>}
        </span>
      </h2>
      {aside}
    </div>
  );
}
