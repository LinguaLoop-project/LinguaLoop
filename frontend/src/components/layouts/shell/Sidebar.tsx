import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { LogoMark } from "@/components/common/Logo";
import { useQuota } from "@/hooks/useQuota";
import type { NavItem, NavTone, ShellConfig } from "./shellConfig";

/**
 * Thanh bên dùng chung (DESIGN.v2 §7.3, §11).
 * - ≥1024px: đầy đủ 248px, người dùng có thể thu thành icon.
 * - 768–1023px: luôn thu thành icon.
 * - <768px: ẩn, mở thành ngăn kéo bằng nút menu ở thanh trên.
 * Tailwind cần class viết nguyên văn nên các biến thể "thu gọn" nằm trong bảng tĩnh bên dưới.
 */

const HIDE_WHEN_COMPACT = { true: "md:hidden", false: "md:max-lg:hidden" } as const;
const CENTER_WHEN_COMPACT = {
  true: "md:justify-center md:px-0",
  false: "md:max-lg:justify-center md:max-lg:px-0",
} as const;
const DOT_WHEN_COMPACT = { true: "md:block", false: "md:max-lg:block" } as const;

/** Mục đang chọn: nền nhạt + vạch 3px bên trái cùng màu chức năng, icon đậm hơn. */
const ACTIVE: Record<NavTone, { box: string; icon: string }> = {
  primary: { box: "bg-primary-soft before:bg-primary", icon: "text-primary-text" },
  dictation: { box: "bg-fn-dictation-soft before:bg-fn-dictation", icon: "text-fn-dictation" },
  shadowing: { box: "bg-fn-shadowing-soft before:bg-fn-shadowing", icon: "text-fn-shadowing" },
  vocab: { box: "bg-fn-vocab-soft before:bg-fn-vocab", icon: "text-fn-vocab" },
  assessment: { box: "bg-fn-assessment-soft before:bg-fn-assessment", icon: "text-fn-assessment" },
};
const BAR = "text-text before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-sm";

const SIZE = {
  comfortable: "min-h-[44px] py-2.5 text-[15px]",
  dense: "min-h-[40px] py-2 text-sm",
} as const;

function Item({
  item,
  config,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  config: ShellConfig;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const { t } = useTranslation("layout");
  const label = t(item.labelKey);
  const tone = ACTIVE[item.tone ?? "primary"];
  const hide = HIDE_WHEN_COMPACT[`${collapsed}`];
  const badgeTone = item.badgeType === "warn" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger";
  const dotTone = item.badgeType === "warn" ? "bg-warning" : "bg-danger";
  const hasBadge = item.badge != null && item.badge !== 0;

  return (
    <NavLink
      to={item.to}
      end={item.to === config.homePath}
      onClick={onNavigate}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        `relative flex items-center gap-3 w-full px-3 rounded-md font-medium select-none transition-colors duration-150 ${SIZE[config.density]} ${CENTER_WHEN_COMPACT[`${collapsed}`]} ${
          isActive ? `${BAR} ${tone.box}` : "text-text-muted hover:bg-surface-hover hover:text-text"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            name={item.icon}
            className={`text-[22px] ${isActive ? tone.icon : ""}`}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span className={`truncate ${hide}`}>{label}</span>
          {hasBadge && (
            <>
              <span
                className={`ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full grid place-items-center text-xs font-semibold ${badgeTone} ${hide}`}
              >
                {item.badge}
              </span>
              <span
                aria-hidden="true"
                className={`absolute right-2 top-2 hidden h-2 w-2 rounded-full ${dotTone} ${DOT_WHEN_COMPACT[`${collapsed}`]}`}
              />
            </>
          )}
        </>
      )}
    </NavLink>
  );
}

function ProUpsell({ hide }: { hide: string }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const { isPro } = useQuota();
  if (isPro) return null;
  return (
    <div className={`pt-4 ${hide}`}>
      <div className="rounded-lg border-2 border-primary bg-surface p-4 shadow-[var(--shadow-card)]">
        <Badge variant="pro">
          <Icon name="crown" fill className="text-[13px]" />
          PRO
        </Badge>
        <b className="mt-2.5 block text-lg font-bold leading-snug text-text">{t("student.sidebar.pro.price")}</b>
        <p className="my-1 mb-3 text-sm leading-relaxed text-text-muted">{t("student.sidebar.pro.desc")}</p>
        <Button size="sm" fullWidth onClick={() => navigate("/pricing")}>
          {t("student.sidebar.pro.cta")}
        </Button>
      </div>
    </div>
  );
}

export interface SidebarProps {
  config: ShellConfig;
  collapsed: boolean;
  drawerOpen: boolean;
  onToggleCollapsed: () => void;
  /** Đóng ngăn kéo (mobile) sau khi chọn mục. */
  onNavigate: () => void;
}

export default function Sidebar({ config, collapsed, drawerOpen, onToggleCollapsed, onNavigate }: SidebarProps) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const hide = HIDE_WHEN_COMPACT[`${collapsed}`];
  const center = CENTER_WHEN_COMPACT[`${collapsed}`];
  const drawer = drawerOpen ? "max-md:flex max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:h-dvh max-md:w-[280px]" : "";

  return (
    <aside
      id="app-sidebar"
      aria-label={t(`${config.ns}.sidebar.aria`)}
      className={`hidden md:flex md:sticky md:top-0 md:h-screen flex-col gap-1 overflow-y-auto border-r border-border bg-bg-elevated p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${drawer}`}
    >
      <button
        type="button"
        className={`group flex items-center gap-2.5 border-0 bg-transparent px-1 pb-5 pt-1 text-left cursor-pointer select-none ${center}`}
        onClick={() => {
          navigate(config.homePath);
          onNavigate();
        }}
        aria-label={t(`${config.ns}.sidebar.homeLabel`)}
      >
        <LogoMark size={40} />
        <span className={`font-display text-[22px] font-extrabold leading-none tracking-tight text-text ${hide}`}>
          Lingua<b className="font-extrabold text-primary-text">Loop</b>
        </span>
      </button>

      {config.sidebarAction && (
        <button
          type="button"
          title={t(config.sidebarAction.labelKey)}
          onClick={() => {
            navigate(config.sidebarAction!.to);
            onNavigate();
          }}
          className={`mb-2 flex min-h-[40px] w-full cursor-pointer items-center gap-2.5 rounded-md border border-border-strong bg-primary-soft px-3 text-sm font-semibold text-primary-text transition-colors hover:bg-surface-hover ${center}`}
        >
          <Icon name={config.sidebarAction.icon} className="text-xl" />
          <span className={hide}>{t(config.sidebarAction.labelKey)}</span>
        </button>
      )}

      {config.groups.map((group, index) => (
        <div key={group.titleKey ?? `g${index}`} className="flex flex-col gap-0.5">
          {group.titleKey && (
            <div className={`px-3 pb-1.5 pt-5 font-body text-xs font-bold uppercase tracking-[0.12em] text-text-subtle ${hide}`}>
              {t(group.titleKey)}
            </div>
          )}
          {group.titleKey && <hr className={`my-2 hidden border-0 border-t border-border ${collapsed ? "md:block" : "md:max-lg:block"}`} />}
          {group.items.map((item) => (
            <Item key={item.id} item={item} config={config} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}

      <div className="flex-1" />

      {config.showProUpsell && <ProUpsell hide={hide} />}

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-controls="app-sidebar"
        aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
        title={collapsed ? t("shell.expand") : t("shell.collapse")}
        className={`mt-1 hidden min-h-[40px] cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent px-3 text-sm font-medium text-text-subtle transition-colors hover:bg-surface-hover hover:text-text lg:flex ${collapsed ? "justify-center px-0" : ""}`}
      >
        <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} className="text-xl" />
        {!collapsed && <span>{t("shell.collapse")}</span>}
      </button>
    </aside>
  );
}
