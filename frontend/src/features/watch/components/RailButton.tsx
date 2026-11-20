import Icon from "@/components/common/Icon";

export interface RailButtonProps {
  icon: string;
  label: string;
  /** Chữ dưới nút (vd số lượt thích); mặc định là `label`. */
  caption?: string;
  active?: boolean;
  activeClassName?: string;
  disabled?: boolean;
  onClick: () => void;
}

/** Một nút tròn trong cột hành động bên phải video. */
export default function RailButton({
  icon,
  label,
  caption,
  active = false,
  activeClassName = "text-primary-text",
  disabled = false,
  onClick,
}: Readonly<RailButtonProps>) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="group flex w-14 cursor-pointer flex-col items-center gap-1 text-white disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span
        className={`grid size-12 place-items-center rounded-full bg-white/12 backdrop-blur-md transition-[background-color,transform] duration-150 group-hover:bg-white/22 group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-white/70 ${
          active ? activeClassName : ""
        }`}
      >
        <Icon name={icon} fill={active} className="size-[22px]" />
      </span>
      <span className="max-w-full truncate text-[11px] font-semibold tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {caption ?? label}
      </span>
    </button>
  );
}
