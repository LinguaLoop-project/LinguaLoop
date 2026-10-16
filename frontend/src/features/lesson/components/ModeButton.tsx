import type { MouseEvent } from "react";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";

export type PracticeMode = "dictation" | "shadowing";

/** Class viết nguyên văn để Tailwind nhận ra; mỗi chế độ dùng màu chức năng của nó (DESIGN.v2 §7.2). */
const STYLE: Record<PracticeMode, { icon: string; button: string }> = {
  dictation: {
    icon: "headphones",
    button: "border-fn-dictation/40 text-fn-dictation hover:bg-fn-dictation-soft hover:border-fn-dictation",
  },
  shadowing: {
    icon: "mic",
    button: "border-fn-shadowing/40 text-fn-shadowing hover:bg-fn-shadowing-soft hover:border-fn-shadowing",
  },
};

export interface ModeButtonProps {
  mode: PracticeMode;
  label: string;
  ariaLabel: string;
  /** 0–100; ≥100 thì hiện dấu đã xong. */
  percent: number;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

/** Nút vào một chế độ luyện, kèm thanh tiến độ riêng của chế độ đó. */
export default function ModeButton({ mode, label, ariaLabel, percent, onClick }: ModeButtonProps) {
  const style = STYLE[mode];
  const done = percent >= 100;
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        data-start={mode}
        aria-label={ariaLabel}
        onClick={onClick}
        className={`flex min-h-10 cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-md border bg-transparent px-1.5 text-xs font-semibold transition-colors duration-150 ${style.button}`}
      >
        <Icon name={style.icon} className="text-base" />
        {label}
        {done && <Icon name="circle-check" className="text-base text-success" />}
      </button>
      <ProgressBar value={percent} tone={mode} label={`${label} ${Math.round(percent)}%`} className="h-1" />
    </div>
  );
}
