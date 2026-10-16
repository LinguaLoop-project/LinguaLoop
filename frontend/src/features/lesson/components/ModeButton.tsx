import type { MouseEvent } from "react";
import Icon from "@/components/common/Icon";

export type PracticeMode = "dictation" | "shadowing";

/** Class viết nguyên văn để Tailwind nhận ra; mỗi chế độ dùng màu chức năng của nó (DESIGN.v2 §7.2). */
const STYLE: Record<PracticeMode, { icon: string; button: string; bar: string }> = {
  dictation: {
    icon: "headphones",
    button: "border-border-strong bg-fn-dictation-soft text-fn-dictation hover:border-fn-dictation",
    bar: "bg-fn-dictation",
  },
  shadowing: {
    icon: "mic",
    button: "border-border-strong bg-fn-shadowing-soft text-fn-shadowing hover:border-fn-shadowing",
    bar: "bg-fn-shadowing",
  },
};

export interface ModeButtonProps {
  mode: PracticeMode;
  label: string;
  ariaLabel: string;
  /** 0–100; 0 nghĩa là chưa học, ≥100 hiện dấu đã xong. */
  percent: number;
  /** Bài Pro khi chưa có gói Pro: thấy khoá trước khi bấm. */
  locked?: boolean;
  /** Chiếm cả hàng (khi thư viện đang lọc theo một chế độ). */
  single?: boolean;
  title: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

/** `.lmode` của mockup: nút cao 40 nền `--fn-soft`, thanh tiến độ 3px sát đáy; bài khoá thì viền đứt, không có thanh. */
export default function ModeButton({ mode, label, ariaLabel, percent, locked = false, single = false, title, onClick }: ModeButtonProps) {
  const style = STYLE[mode];
  const done = percent >= 100;
  return (
    <button
      type="button"
      data-start={mode}
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={`relative flex h-10 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md border text-[13px] font-semibold transition-[border-color,transform] duration-150 active:translate-y-0.5 ${single ? "col-span-full" : ""} ${
        locked ? "border-dashed border-border-strong bg-transparent text-text-muted hover:border-warning hover:text-text" : style.button
      }`}
    >
      <Icon name={locked ? "lock" : style.icon} className="h-4 w-4" />
      {label}
      {!locked && done && <Icon name="circle-check" className="h-4 w-4 text-success" />}
      {!locked && percent > 0 && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-[3px] transition-[width] duration-[400ms] ease-out ${done ? "bg-success" : style.bar}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      )}
    </button>
  );
}
