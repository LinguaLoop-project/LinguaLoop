export interface SkeletonProps {
  className?: string;
}

/** Khối chờ tải có cùng hình dạng với nội dung thật. Shimmer tự tắt khi bật giảm chuyển động. */
export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton rounded-md bg-surface-hover ${className}`} />;
}
