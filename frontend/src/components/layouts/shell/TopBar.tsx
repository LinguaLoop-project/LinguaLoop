import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useQuota } from "@/hooks/useQuota";
import DevPlanSwitch from "@/features/subscription/components/DevPlanSwitch";
import { DEV_TOOLS_ENABLED } from "@/features/subscription/devTools";
import { useTheme } from "@/hooks/useTheme";
import AccountMenu from "./AccountMenu";
import type { ShellConfig } from "./shellConfig";

const PILL =
  "inline-flex h-9 select-none items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-text [&>svg]:h-[18px] [&>svg]:w-[18px]";

/** Trang con `/admin/users/123` dùng khoá `userDetail`: số ít của đoạn đầu + "Detail". */
function titleKeyFor(pathname: string, homePath: string): string {
  const [first, second] = pathname.replace(homePath, "").split("/").filter(Boolean);
  if (!first) return "overview";
  return second ? `${first.replace(/s$/, "")}Detail` : first;
}

function Breadcrumb({ config }: { config: ShellConfig }) {
  const { t, i18n } = useTranslation("layout");
  const { pathname } = useLocation();
  const key = `${config.ns}.topbar.titles.${titleKeyFor(pathname, config.homePath)}`;
  const title = i18n.exists(key, { ns: "layout" }) ? t(key) : t(`${config.ns}.topbar.titles.overview`);
  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label={t(`${config.ns}.topbar.breadcrumbAria`)}>
      <Link to={config.homePath} className="font-medium text-text-muted transition-colors hover:text-primary-text">
        {t(`${config.ns}.topbar.root`)}
      </Link>
      <Icon name="chevron-right" className="text-xs text-text-subtle" />
      <b className="truncate font-semibold text-text">{title}</b>
    </nav>
  );
}

export interface TopBarProps {
  config: ShellConfig;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onOpenPalette: () => void;
}

/** Thanh trên theo mockup v2 (`.topbar`): cao 64, nền bg-base 82% + mờ, ô tìm nhanh, chuỗi ngày, gói, đổi giao diện, tài khoản. */
export default function TopBar({ config, drawerOpen, onOpenDrawer, onOpenPalette }: TopBarProps) {
  const { t } = useTranslation("layout");
  const { isPro, actionsToday, maxActions } = useQuota();
  const { isDark, toggleTheme } = useTheme();
  const learner = config.topBar.kind === "learner";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-[color-mix(in_srgb,var(--bg-base)_82%,transparent)] px-3 backdrop-blur-[12px] md:px-6">
      <Button
        variant="ghost"
        iconOnly
        onClick={onOpenDrawer}
        aria-label={t("shell.openMenu")}
        aria-expanded={drawerOpen}
        aria-controls="app-sidebar"
        className="md:hidden"
      >
        <Icon name="menu" />
      </Button>

      {learner ? (
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label={t("student.topbar.search")}
          className="inline-flex h-11 w-11 min-w-0 cursor-pointer items-center justify-center gap-2.5 rounded-md border border-border-strong bg-surface text-text-subtle transition-colors hover:border-primary md:w-[min(420px,100%)] md:justify-start md:pl-3.5 md:pr-3"
        >
          <Icon name="search" className="text-xl" />
          <span className="hidden flex-1 truncate text-left md:block">{t("student.topbar.searchPlaceholder")}</span>
          <kbd className="hidden rounded-md border border-border-strong bg-bg-elevated px-1.5 py-1 font-body text-[11px] font-semibold leading-none text-text-muted md:inline">
            Ctrl K
          </kbd>
        </button>
      ) : (
        <Breadcrumb config={config} />
      )}

      <span className="flex-1" />

      {learner && (
        <>
          {DEV_TOOLS_ENABLED && <DevPlanSwitch />}
          <span className={`${PILL} max-sm:hidden`} title={t("student.topbar.streak")}>
            <Icon name="flame" />
            <span className="font-display tabular-nums">4</span>
          </span>
          {!isPro && (
            <span className={`${PILL} max-md:hidden`} title={t("student.topbar.quota")} aria-label={`${t("student.topbar.quota")}: ${actionsToday}/${maxActions}`}>
              <Icon name="zap" />
              <span className="font-display tabular-nums">
                {actionsToday}/{maxActions}
              </span>
            </span>
          )}
          <span
            className={`${PILL} hidden md:inline-flex ${isPro ? "border-warning text-warning" : ""}`}
            title={t("student.topbar.plan")}
          >
            {isPro ? (
              <>
                <Icon name="crown" />
                PRO
              </>
            ) : (
              "Free"
            )}
          </span>
        </>
      )}

      <span className="max-sm:hidden">
        <LanguageSwitcher />
      </span>
      <Button variant="ghost" iconOnly onClick={toggleTheme} aria-label={t("theme.toggle")} title={isDark ? t("theme.toLight") : t("theme.toDark")}>
        <Icon name={isDark ? "sun" : "moon"} />
      </Button>
      <AccountMenu config={config} />
    </header>
  );
}
