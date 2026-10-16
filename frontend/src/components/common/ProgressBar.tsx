export type ProgressTone = "primary" | "dictation" | "shadowing" | "vocab" | "assessment" | "success";

const FILL: Record<ProgressTone, string> = {
  primary: "bg-primary",
  dictation: "bg-fn-dictation",
  shadowing: "bg-fn-shadowing",
  vocab: "bg-fn-vocab",
  assessment: "bg-fn-assessment",
  success: "bg-success",
};

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  tone?: ProgressTone;
  label: string;
  /** Thanh mảnh 6px (`.bar.thin`); mặc định 8px (`.bar`). */
  thin?: boolean;
  className?: string;
}

/** Thanh tiến độ: nền `--border`, phần đầy theo màu chức năng, tăng mượt 400ms (DESIGN.v2 §7.5). */
export default function ProgressBar({ value, tone = "primary", label, thin = false, className = "" }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`w-full overflow-hidden rounded-full bg-border ${thin ? "h-1.5" : "h-2"} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-[400ms] ease-out ${FILL[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
