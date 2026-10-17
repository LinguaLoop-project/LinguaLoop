import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { useQuota } from "@/hooks/useQuota";
import type { NavItem, NavTone, ShellConfig } from "./shellConfig";

/**
 * Thanh bên theo mockup v2 (`.rail`, `.nav`).
 * - ≥1024px: đầy đủ 248px, người dùng có thể thu thành icon (76px).
 * - 768–1023px: luôn thu thành icon.
 * - <768px: ẩn, mở thành ngăn kéo bằng nút menu ở thanh trên.
 * Tailwind cần class viết nguyên văn nên các biến thể "thu gọn" nằm trong bảng tĩnh bên dưới.
 */

const HIDE_WHEN_COMPACT = { true: "md:hidden", false: "md:max-lg:hidden" } as const;
const CENTER_WHEN_COMPACT = {
  true: "md:w-12 md:justify-center md:px-0",
  false: "md:max-lg:w-12 md:max-lg:justify-center md:max-lg:px-0",
} as const;
const BAR_WHEN_COMPACT = { true: "md:before:-left-2.5", false: "md:max-lg:before:-left-2.5" } as const;
const PAD_WHEN_COMPACT = { true: "md:items-center md:px-2.5", false: "md:max-lg:items-center md:max-lg:px-2.5" } as const;
const DOT_WHEN_COMPACT = { true: "md:block", false: "md:max-lg:block" } as const;

/** Màu chức năng của mục: icon luôn có màu, mục đang chọn nền `--fn-soft` + vạch 4px sát mép thanh bên. */
const TONE: Record<NavTone, { icon: string; on: string; tag: string }> = {
  primary: { icon: "text-primary", on: "bg-primary-soft before:bg-primary", tag: "bg-primary-soft text-primary" },
  dictation: { icon: "text-fn-dictation", on: "bg-fn-dictation-soft before:bg-fn-dictation", tag: "bg-fn-dictation-soft text-fn-dictation" },
  shadowing: { icon: "text-fn-shadowing", on: "bg-fn-shadowing-soft before:bg-fn-shadowing", tag: "bg-fn-shadowing-soft text-fn-shadowing" },
  vocab: { icon: "text-fn-vocab", on: "bg-fn-vocab-soft before:bg-fn-vocab", tag: "bg-fn-vocab-soft text-fn-vocab" },
  assessment: { icon: "text-fn-assessment", on: "bg-fn-assessment-soft before:bg-fn-assessment", tag: "bg-fn-assessment-soft text-fn-assessment" },
};
const ON_BAR =
  "text-text font-semibold before:content-[''] before:absolute before:-left-3.5 before:top-2.5 before:bottom-2.5 before:w-1 before:rounded-r-[4px]";

function Item({ item, config, collapsed, onNavigate }: { item: NavItem; config: ShellConfig; collapsed: boolean; onNavigate: () => void }) {
  const { t } = useTranslation("layout");
  const label = t(item.labelKey);
  const tone = TONE[item.tone ?? "primary"];
  const hide = HIDE_WHEN_COMPACT[`${collapsed}`];
  const hasBadge = item.badge != null && item.badge !== 0;

  return (
    <NavLink
      to={item.to}
      end={item.to === config.homePath}
      onClick={onNavigate}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        `group relative flex min-h-11 w-full items-center gap-3 rounded-md px-3 font-medium transition-colors duration-150 ${CENTER_WHEN_COMPACT[`${collapsed}`]} ${BAR_WHEN_COMPACT[`${collapsed}`]} ${
          isActive ? `${ON_BAR} ${tone.on}` : "text-text-muted hover:bg-surface-hover hover:text-text"
        }`
      }
    >
      <Icon name={item.icon} className={`text-2xl transition-transform duration-150 group-hover:translate-x-0.5 ${tone.icon}`} />
      <span className={`truncate ${hide}`}>{label}</span>
      {hasBadge && (
        <>
          <span
            className={`ml-auto grid h-[22px] min-w-6 place-items-center rounded-full px-[7px] text-xs font-bold ${
              item.badgeType === "warn" ? "bg-warning/15 text-warning" : tone.tag
            } ${hide}`}
          >
            {item.badge}
          </span>
          <span aria-hidden="true" className={`absolute right-1 top-1 hidden h-2 w-2 rounded-full bg-danger ${DOT_WHEN_COMPACT[`${collapsed}`]}`} />
        </>
      )}
    </NavLink>
  );
}

function ProCard({ hide }: { hide: string }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const { isPro } = useQuota();
  if (isPro) return null;
  return (
    <div className={`mb-2 rounded-lg border border-border-strong bg-surface p-3.5 shadow-[var(--shadow-card)] ${hide}`}>
      <Badge variant="pro">
        <Icon name="crown" />
        PRO
      </Badge>
      <b className="mt-2.5 block text-lg font-bold leading-[1.4]">{t("student.sidebar.pro.price")}</b>
      <p className="my-1 mb-3 text-[13px] leading-normal text-text-muted">{t("student.sidebar.pro.desc")}</p>
      <Button size="sm" fullWidth onClick={() => navigate("/pricing")}>
        {t("student.sidebar.pro.cta")}
      </Button>
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
  const key = `${collapsed}` as "true" | "false";
  const hide = HIDE_WHEN_COMPACT[key];
  const drawer = drawerOpen ? "max-md:flex max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:h-dvh max-md:w-[248px]" : "";

  return (
    <aside
      id="app-sidebar"
      aria-label={t(`${config.ns}.sidebar.aria`)}
      className={`hidden flex-col gap-1 overflow-y-auto overflow-x-hidden border-r border-border bg-bg-elevated px-3.5 py-5 [scrollbar-width:none] md:sticky md:top-0 md:flex md:h-screen [&::-webkit-scrollbar]:hidden ${PAD_WHEN_COMPACT[key]} ${drawer}`}
    >
      <div className={`flex items-center justify-between gap-2 pb-3 ${collapsed ? "md:flex-col" : "md:max-lg:flex-col md:max-lg:justify-center"}`}>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2.5 border-0 bg-transparent px-1.5 py-1 text-left text-text"
          onClick={() => {
            navigate(config.homePath);
            onNavigate();
          }}
          aria-label={t(`${config.ns}.sidebar.homeLabel`)}
        >
          <img src="/app-icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span className={`font-display text-xl font-bold leading-none tracking-[-0.03em] ${hide}`}>
            Lingua<b className="font-bold text-primary-text">Loop</b>
          </span>
        </button>
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          className="hidden lg:inline-flex"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
          title={collapsed ? t("shell.expand") : t("shell.collapse")}
        >
          <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} />
        </Button>
      </div>

      {config.sidebarAction && (
        <button
          type="button"
          title={t(config.sidebarAction.labelKey)}
          onClick={() => {
            navigate(config.sidebarAction!.to);
            onNavigate();
          }}
          className={`mb-1 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-border-strong bg-primary-soft px-3 text-[15px] font-semibold text-text transition-colors hover:bg-surface-hover ${CENTER_WHEN_COMPACT[key]}`}
        >
          <Icon name={config.sidebarAction.icon} className="text-2xl text-primary" />
          <span className={hide}>{t(config.sidebarAction.labelKey)}</span>
        </button>
      )}

      {config.groups.map((group, index) => (
        <div key={group.titleKey ?? `g${index}`} className="flex flex-col gap-1">
          {group.titleKey && (
            <div className={`px-3 pb-1 pt-3.5 text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text ${hide}`}>
              {t(group.titleKey)}
            </div>
          )}
          {group.items.map((item) => (
            <Item key={item.id} item={item} config={config} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}

      <div className="flex-1" />

      {config.showProUpsell && <ProCard hide={hide} />}

      {config.showProUpsell && (
        <div className={`flex items-center gap-3 rounded-lg border border-border bg-primary-soft p-3.5 ${collapsed ? "md:p-2" : "md:max-lg:p-2"}`}>
          <Mascot mood="hello" size={44} alt="" />
          <div className={hide}>
            <b className="text-[13px]">Loopi</b>
            <div className="text-[13px] leading-normal text-text-muted">{t("student.sidebar.loopi")}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
