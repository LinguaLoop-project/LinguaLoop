import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { buttonClasses } from "@/components/common/buttonStyles";
import Icon from "@/components/common/Icon";

export interface Crumb {
  label: string;
  /** Bỏ trống cho mục cuối (trang hiện tại). */
  to?: string;
}

/** `.crumbs` của mockup: các mục trước là nút chữ màu primary, mục cuối là chữ muted; `aside` đặt sát phải. */
export default function Breadcrumbs({ items, aside }: { items: Crumb[]; aside?: ReactNode }) {
  return (
    <nav aria-label="breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-text-muted">
      {items.map((item, index) => (
        <Fragment key={`${index}-${item.label}`}>
          {index > 0 && <Icon name="chevron-right" className="text-xl" />}
          {item.to ? (
            <Link to={item.to} className={buttonClasses({ variant: "text", size: "sm" })}>
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
      {aside && <span className="ml-auto">{aside}</span>}
    </nav>
  );
}
