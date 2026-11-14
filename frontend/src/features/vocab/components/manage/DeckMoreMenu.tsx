import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";

export interface DeckMoreMenuProps {
  onDelete: () => void;
}

/** Menu "⋯" trên trang bộ, giữ thao tác ít dùng và nguy hiểm (Xóa bộ) tách khỏi nút chính. Esc hoặc bấm ra ngoài để đóng. */
export default function DeckMoreMenu({ onDelete }: DeckMoreMenuProps) {
  const { t } = useTranslation("vocab");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <Button
        variant="ghost"
        iconOnly
        aria-label={t("manage.detail.more")}
        title={t("manage.detail.more")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="ellipsis" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 min-w-44 rounded-md border border-border-strong bg-surface p-1 shadow-[var(--shadow-card)]"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-danger hover:bg-surface-hover"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Icon name="trash-2" />
            {t("manage.detail.deleteDeck")}
          </button>
        </div>
      )}
    </div>
  );
}
