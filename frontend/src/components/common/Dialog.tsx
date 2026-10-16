import { useEffect, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** id của tiêu đề, để trình đọc màn hình gắn nhãn cho hộp thoại. */
  labelledBy: string;
  children: ReactNode;
}

/** Hộp thoại giữa màn hình (`.dialog` + `.scrim` trong mockup v2): nền đặc, bo xl, padding 24, Esc hoặc bấm nền để đóng. */
export default function Dialog({ open, onClose, labelledBy, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="fixed inset-0 z-[80] cursor-default border-0 bg-[rgba(7,5,13,.55)]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="fixed left-1/2 top-[22vh] z-[90] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 animate-[menu-in_200ms_var(--ease-out)] rounded-xl border border-border-strong bg-surface p-6 shadow-[0_24px_48px_-16px_rgba(0,0,0,.55),0_0_0_1px_var(--border)]"
      >
        {children}
      </div>
    </>
  );
}
