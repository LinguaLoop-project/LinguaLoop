import { useEffect, useRef, useState, type ReactNode } from "react";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";

export interface PopoverProps {
  /** Nhãn đọc màn hình của nút mở (cũng là tên của hộp thoại). */
  label: string;
  /** Tên icon Lucide của nút mở. */
  icon: string;
  children: ReactNode;
}

/** Nút icon mở một hộp nhỏ: đóng khi bấm ra ngoài hoặc nhấn Esc (`.dc-pop` của mockup). */
export default function Popover({ label, icon, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <Button variant="ghost" iconOnly aria-label={label} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name={icon} />
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 top-[calc(100%+8px)] z-40 flex w-80 flex-col gap-2.5 rounded-lg border border-border-strong bg-surface p-3.5 shadow-[var(--shadow-card)] max-md:fixed max-md:inset-x-4 max-md:top-[120px] max-md:w-auto"
        >
          {children}
        </div>
      )}
    </div>
  );
}
