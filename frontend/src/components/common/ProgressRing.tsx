import type { ProgressTone } from "./ProgressBar";

const STROKE: Record<ProgressTone, string> = {
  primary: "stroke-primary",
  dictation: "stroke-fn-dictation",
  shadowing: "stroke-fn-shadowing",
  vocab: "stroke-fn-vocab",
  assessment: "stroke-fn-assessment",
  success: "stroke-success",
};

export interface ProgressRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  tone?: ProgressTone;
  /** Chữ nhỏ dưới số, vd "%". */
  label?: string;
  ariaLabel: string;
}

/** Vòng tiến độ (`.ring` của mockup): nét 10/100, đầu tròn, số ở giữa theo font display. */
export default function ProgressRing({ value, size = 88, tone = "primary", label, ariaLabel }: ProgressRingProps) {
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div role="img" aria-label={`${ariaLabel} ${Math.round(pct)}%`} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth={10} strokeLinecap="round" className="stroke-border" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          className={`${STROKE[tone]} transition-[stroke-dashoffset] duration-[400ms] ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center leading-[1.1]">
        <span className="font-display tabular-nums" style={{ fontSize: Math.round(size * 0.27) }}>
          {Math.round(pct)}
        </span>
        {label && <span className="text-[13px] text-text-muted">{label}</span>}
      </div>
    </div>
  );
}
