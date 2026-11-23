import type { ModeProgress } from "../types";

/** Hai thanh tiến độ mảnh (Nghe chép trên, Shadowing dưới) đặt sát mép đáy ảnh bìa; chỉ để trang trí nên ẩn với trình đọc màn hình. */
export default function ModeRails({ progress, className = "" }: { progress: ModeProgress; className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-px ${className}`}>
      <span className="block h-[3px] w-full bg-white/15">
        <span className="block h-full bg-fn-dictation" style={{ width: `${progress.dictationPercent}%` }} />
      </span>
      <span className="block h-[3px] w-full bg-white/15">
        <span className="block h-full bg-fn-shadowing" style={{ width: `${progress.shadowingPercent}%` }} />
      </span>
    </div>
  );
}
