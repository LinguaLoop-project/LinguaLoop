import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import { isWordNotFound, useWordLookup } from "../hooks";
import { normalizeWord } from "../utils";
import WordCard from "./WordCard";

const POPOVER_WIDTH = 360;
const POPOVER_MAX_HEIGHT = 340;
const GAP = 8;

function WordPopoverBody({ word }: { word: string }) {
  const { t } = useTranslation("dictionary");
  const lookup = useWordLookup(word);

  if (lookup.isPending) {
    return (
      <div className="flex flex-col gap-2.5" aria-busy="true" aria-label={t("lookup.loading")}>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (lookup.isError) {
    if (isWordNotFound(lookup.error)) {
      return <p className="text-[13px] text-text-muted">{t("lookup.notFound", { word })}</p>;
    }
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-[13px] text-text-muted">{t("lookup.error")}</p>
        <Button variant="ghost" size="sm" isLoading={lookup.isFetching} onClick={() => void lookup.refetch()}>
          {t("lookup.retry")}
        </Button>
      </div>
    );
  }
  return <WordCard word={lookup.data} />;
}

interface WordPopoverProps {
  word: string;
  anchor: DOMRect;
  anchorElement: HTMLElement;
  onClose: () => void;
}

/** Hộp tra từ gắn vào chữ vừa bấm; mở lên trên nếu phía dưới không đủ chỗ. Đóng khi bấm ra ngoài, Esc, cuộn hoặc đổi cỡ cửa sổ. */
function WordPopover({ word, anchor, anchorElement, onClose }: WordPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || anchorElement?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onScroll = (event: Event) => {
      if (popoverRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [anchorElement, onClose]);

  const width = Math.min(POPOVER_WIDTH, window.innerWidth - 2 * GAP);
  const left = Math.max(GAP, Math.min(anchor.left, window.innerWidth - width - GAP));
  const fitsBelow = anchor.bottom + GAP + POPOVER_MAX_HEIGHT <= window.innerHeight;
  const openAbove = !fitsBelow && anchor.top > window.innerHeight - anchor.bottom;
  const vertical = openAbove ? { bottom: window.innerHeight - anchor.top + GAP } : { top: anchor.bottom + GAP };

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={word}
      style={{ left, width, maxHeight: Math.min(POPOVER_MAX_HEIGHT, window.innerHeight - 2 * GAP), ...vertical }}
      className="fixed z-[95] overflow-y-auto rounded-lg border border-border-strong bg-bg-elevated p-4 shadow-[var(--shadow-card)]"
    >
      <WordPopoverBody word={word} />
    </div>,
    document.body,
  );
}

export interface LookupWordProps {
  /** Chữ cần tra (chưa cần chuẩn hóa: chữ hoa, dấu câu hai đầu được xử lý ở đây). */
  word: string;
  className?: string;
  /** Nội dung hiển thị; mặc định là chính `word`. */
  children?: ReactNode;
}

/** Một chữ bấm được: mở hộp tra từ ngay cạnh chữ. Chữ không có chữ cái hoặc số nào thì hiện như text thường. */
export default function LookupWord({ word, className = "", children }: LookupWordProps) {
  const { t } = useTranslation("dictionary");
  const [open, setOpen] = useState<{ rect: DOMRect; element: HTMLElement } | null>(null);
  const normalized = normalizeWord(word);
  const content = children ?? word;

  if (!normalized) return <>{content}</>;

  return (
    <>
      <button
        type="button"
        title={t("lookup.hint")}
        aria-haspopup="dialog"
        aria-expanded={open !== null}
        onClick={(event) => {
          const element = event.currentTarget;
          setOpen(open ? null : { rect: element.getBoundingClientRect(), element });
        }}
        className={`cursor-pointer rounded-sm text-left transition-colors hover:bg-primary-soft hover:text-primary-text focus-visible:bg-primary-soft focus-visible:outline-none ${
          open ? "bg-primary-soft text-primary-text" : ""
        } ${className}`}
      >
        {content}
      </button>
      {open && (
        <WordPopover
          word={normalized}
          anchor={open.rect}
          anchorElement={open.element}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
