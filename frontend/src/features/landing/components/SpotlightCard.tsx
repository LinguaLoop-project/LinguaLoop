import { useRef, type MouseEvent, type ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  as?: "article" | "div";
  /** Màu CSS cho vầng sáng theo con trỏ; mặc định theo `--primary`. */
  glowColor?: string;
}

/**
 * Thẻ có vầng sáng dịu bám theo con trỏ chuột khi hover.
 * Cập nhật trực tiếp biến CSS trên ref nên không kích hoạt React re-render ở 60fps.
 */
export default function SpotlightCard({
  children,
  className = "",
  as = "div",
  glowColor = "var(--primary)",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  const Tag = as;

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      onMouseMove={handleMouseMove}
      className={`group/spot relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-border-strong ${className}`}
    >
      <div
        aria-hidden="true"
        style={{
          background: `radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, ${glowColor} 15%, transparent), transparent 65%)`,
        }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
      />
      <div className="relative z-[1] flex h-full flex-col justify-between gap-6">{children}</div>
    </Tag>
  );
}
