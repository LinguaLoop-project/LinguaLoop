import { useEffect, useRef, useState, type ReactNode } from "react";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";

export interface ToolbarPopoverProps {
  label: string;
  icon: string;
  children: ReactNode;
}

/** Nút biểu tượng mở một hộp nhỏ bên dưới (cài đặt, phím tắt); bấm ra ngoài hoặc Esc để đóng. */
export default function ToolbarPopover({ label, icon, children }: ToolbarPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button variant="ghost" iconOnly aria-label={label} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name={icon} />
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute right-0 top-full z-30 mt-2 w-[min(320px,calc(100vw-32px))] rounded-lg border border-border-strong bg-surface p-4 shadow-[var(--shadow-card)]"
        >
          {children}
        </div>
      )}
    </div>
  );
}
