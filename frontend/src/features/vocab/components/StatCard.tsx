export interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  /** Class màu chữ của nhãn, vd `text-danger`. */
  tone: string;
}

/** Một số tổng trong hàng tổng quan của trang Từ vựng và Từ & câu đã lưu. */
export default function StatCard({ label, value, hint, tone }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className={`text-xs font-bold uppercase tracking-wider ${tone}`}>{label}</span>
      <span className="font-display text-[30px] font-bold leading-none">{value}</span>
      <span className="text-[13px] text-text-muted">{hint}</span>
    </div>
  );
}
