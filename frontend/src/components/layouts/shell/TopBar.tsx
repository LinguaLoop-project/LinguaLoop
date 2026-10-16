import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useQuota } from "@/hooks/useQuota";
import AccountMenu from "./AccountMenu";
import type { ShellConfig } from "./shellConfig";

const PILL =
  "inline-flex h-10 select-none items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3.5 text-[15px] font-semibold";

/** Trang con `/admin/users/123` dùng khoá `userDetail`: số ít của đoạn đầu + "Detail". */
function titleKeyFor(pathname: string, homePath: string): string {
  const [first, second] = pathname.replace(homePath, "").split("/").filter(Boolean);
  if (!first) return "overview";
  return second ? `${first.replace(/s$/, "")}Detail` : first;
}

function LearnerActions() {
  const { t } = useTranslation("layout");
  const { isPro, actionsToday, maxActions } = useQuota();
  return (
    <>
      <span className={`${PILL} max-sm:hidden`} title={t("student.topbar.streak")}>
        <Icon name="flame" fill className="text-lg text-warning" />
        <span>5</span>
      </span>
      {!isPro && (
        <span className={`${PILL} max-sm:hidden`} title={t("student.topbar.quota")}>
          <Icon name="zap" fill className="text-lg text-primary-text" />
          <span>
            {maxActions - actionsToday}/{maxActions}
          </span>
        </span>
      )}
      <span className={`${PILL} hidden md:inline-flex ${isPro ? "bg-primary-soft text-primary-text" : "text-text"}`}>
        {isPro ? "Pro" : "Free"}
      </span>
    </>
  );
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
}

export default function TopBar({ config, drawerOpen, onOpenDrawer }: TopBarProps) {
  const { t } = useTranslation("layout");
  const learner = config.topBar.kind === "learner";
  const pad = config.density === "dense" ? "py-2.5 md:px-7" : "py-2.5 md:px-6 md:py-4";

  return (
    <header className={`sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg-base/80 px-4 backdrop-blur-md ${pad}`}>
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label={t("shell.openMenu")}
        aria-expanded={drawerOpen}
        aria-controls="app-sidebar"
        className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-transparent text-text-muted transition-colors hover:bg-surface-hover hover:text-text md:hidden"
      >
        <Icon name="menu" className="text-xl" />
      </button>

      {learner ? (
        <button
          type="button"
          disabled
          aria-label={t("student.topbar.search")}
          className="flex h-11 w-11 items-center justify-center gap-2.5 rounded-md border border-border bg-surface px-3.5 text-[15px] text-text-muted md:w-auto md:max-w-[480px] md:flex-1 md:justify-start"
        >
          <Icon name="search" className="text-xl" />
          <span className="hidden md:inline">{t("student.topbar.searchPlaceholder")}</span>
          <kbd className="ml-auto hidden rounded border border-border bg-surface-hover px-1.5 py-0.5 text-xs font-semibold text-text-muted md:inline">
            Ctrl K
          </kbd>
        </button>
      ) : (
        <Breadcrumb config={config} />
      )}

      <div className="ml-auto flex items-center gap-2">
        {learner && <LearnerActions />}
        <ThemeToggle sizeClass="size-10" />
        <LanguageSwitcher heightClass="h-10" />
        <AccountMenu config={config} />
      </div>
    </header>
  );
}
