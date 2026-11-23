import Icon from "@/components/common/Icon";

export interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  /** Class màu chữ của nhãn, vd `text-danger`. */
  tone: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

/** Một số tổng trong hàng tổng quan của trang Từ vựng và Từ & câu đã lưu; khi có `onClick` thì đóng vai trò thẻ lọc. */
export default function StatCard({ label, value, hint, tone, icon, active = false, onClick }: StatCardProps) {
  const content = (
    <>
      <div className="flex flex-col gap-1">
        <span className={`text-xs font-bold uppercase tracking-wider ${tone}`}>{label}</span>
        <span className="font-display text-[30px] font-bold tabular-nums leading-none">{value}</span>
        <span className="text-[13px] text-text-muted">{hint}</span>
      </div>
      {icon && (
        <span className={`grid size-9 shrink-0 place-items-center rounded-md bg-bg-elevated ${tone}`}>
          <Icon name={icon} className="size-5" />
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={`flex cursor-pointer items-start justify-between rounded-lg border p-4 text-left shadow-[var(--shadow-card)] transition-all duration-150 ${
          active
            ? "border-primary bg-primary-soft/60 shadow-[0_0_0_1px_var(--primary)]"
            : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover/60"
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      {content}
    </div>
  );
}
