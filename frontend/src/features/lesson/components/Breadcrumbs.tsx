import { Fragment } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/common/Icon";

export interface Crumb {
  label: string;
  /** Bỏ trống cho mục cuối (trang hiện tại). */
  to?: string;
}

/** Đường dẫn "Bài học › Chủ đề › Bài" dùng cho trang chủ đề và chi tiết bài. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-text-muted">
      {items.map((item, index) => (
        <Fragment key={`${index}-${item.label}`}>
          {index > 0 && <Icon name="chevron-right" className="text-[14px]" />}
          {item.to ? (
            <Link to={item.to} className="inline-flex min-h-8 items-center text-text-muted hover:text-text hover:underline">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
