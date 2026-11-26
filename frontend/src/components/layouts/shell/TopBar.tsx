import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useAiEnergy } from "@/hooks/useAiEnergy";
import DevPlanSwitch from "@/features/subscription/components/DevPlanSwitch";
import { DEV_TOOLS_ENABLED } from "@/features/subscription/devTools";
import { useTheme } from "@/hooks/useTheme";
import { useStreak } from "@/features/stats";
import { NotificationBell } from "@/features/user";
import AccountMenu from "./AccountMenu";
import type { ShellConfig } from "./shellConfig";

/** Nút tròn 32px trong cụm điều khiển bên phải thanh trên. */
const GROUP_BUTTON =
  "grid h-8 w-8 cursor-pointer place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-hover hover:text-text [&>svg]:h-[18px] [&>svg]:w-[18px]";
const DIVIDER = "mx-0.5 h-4 w-px shrink-0 bg-border";

/** Mục con bên trong thanh trạng thái học tập (cao 32px, nằm gọn trong khung h-10). */
const STAT_ITEM =
  "inline-flex h-8 select-none items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-text no-underline transition-colors hover:bg-surface-hover [&>svg]:h-[17px] [&>svg]:w-[17px]";

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

/**
 * Thanh trên đồng nhất chiều cao (`h-10`) và chia rõ 2 cụm bên phải:
 * - Cụm 1 (học viên): trạng thái học tập gom gọn (Chuỗi ngày | Credit AI | Gói Pro/Free).
 * - Cụm 2 (mọi vai trò): tiện ích & tài khoản (Ngôn ngữ gọn VI/EN | Đổi sáng/tối | Thông báo | Avatar).
 */
export default function TopBar({ config, drawerOpen, onOpenDrawer, onOpenPalette }: TopBarProps) {
  const { t, i18n } = useTranslation("layout");
  const { isPro, remaining, resetsAt, balance } = useAiEnergy();
  const { isDark, toggleTheme } = useTheme();
  const learner = config.topBar.kind === "learner";
  const { data: streak } = useStreak(learner);
  const studiedToday = Boolean(streak?.studiedToday);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2.5 border-b border-border bg-[color-mix(in_srgb,var(--bg-base)_84%,transparent)] px-3 backdrop-blur-[12px] md:gap-3 md:px-6">
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

      {/* Vùng trái: Ô tìm nhanh (học viên) hoặc Breadcrumb (giáo viên / admin) */}
      {learner ? (
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label={t("student.topbar.search")}
          className="inline-flex h-10 w-10 min-w-0 cursor-pointer items-center justify-center gap-2.5 rounded-md border border-border-strong bg-surface text-sm text-text-subtle transition-colors hover:border-primary/60 hover:text-text md:w-[min(380px,100%)] md:justify-start md:pl-3.5 md:pr-2.5"
        >
          <Icon name="search" className="text-lg shrink-0" />
          <span className="hidden flex-1 truncate text-left md:block">{t("student.topbar.searchPlaceholder")}</span>
          <kbd className="hidden rounded-sm border border-border-strong bg-bg-elevated px-1.5 py-0.5 font-body text-[11px] font-semibold leading-none text-text-muted md:inline">
            Ctrl K
          </kbd>
        </button>
      ) : (
        <Breadcrumb config={config} />
      )}

      <span className="flex-1" />

      {/* Công cụ dev (chỉ bật trong môi trường phát triển) */}
      {learner && DEV_TOOLS_ENABLED && <DevPlanSwitch />}

      {/* Cụm 1 (học viên): Trạng thái học tập gom trong 1 thanh gọn — Chuỗi ngày · Credit · Gói */}
      {learner && (
        <div className="hidden h-10 items-center gap-0.5 rounded-full border border-border bg-surface p-1 shadow-xs sm:inline-flex">
          <Link
            to="/student"
            className={`${STAT_ITEM} ${studiedToday ? "" : "text-text-muted"}`}
            title={
              studiedToday
                ? `${t("student.topbar.streak")}: ${streak?.current ?? 0} · ${t("student.topbar.studiedToday")}`
                : `${t("student.topbar.streak")}: ${streak?.current ?? 0} · ${t("student.topbar.notStudiedToday")}`
            }
            aria-label={`${t("student.topbar.streak")}: ${streak?.current ?? 0}`}
          >
            <Icon name="flame" fill={studiedToday} className={studiedToday ? "text-warning" : "text-text-subtle"} />
            <span className="font-display tabular-nums">{streak?.current ?? 0}</span>
          </Link>

          {remaining !== null && (
            <>
              <span aria-hidden="true" className={`${DIVIDER} max-md:hidden`} />
              <Link
                to="/student/settings?tab=plan"
                className={`${STAT_ITEM} max-md:hidden ${remaining <= 0 ? "text-danger" : ""}`}
                title={
                  resetsAt
                    ? `${t("student.topbar.quota")} · ${new Date(resetsAt).toLocaleDateString(i18n.language)}`
                    : t("student.topbar.quota")
                }
                aria-label={`${t("student.topbar.quota")}: ${remaining}`}
              >
                <Icon name="zap" fill className={remaining <= 0 ? "text-danger" : "text-primary-text"} />
                <span className="font-display tabular-nums">{remaining}</span>
              </Link>
            </>
          )}

          <span aria-hidden="true" className={`${DIVIDER} hidden lg:block`} />
          <Link
            to={isPro ? "/student/settings?tab=plan" : "/student/subscription"}
            className={`hidden h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold no-underline transition-colors lg:inline-flex ${
              isPro
                ? "bg-warning/15 text-warning hover:bg-warning/25"
                : "bg-bg-elevated text-text-muted hover:bg-primary-soft hover:text-primary-text"
            }`}
            title={t("student.topbar.plan")}
          >
            {isPro ? (
              <>
                <Icon name="crown" className="text-xs" fill />
                PRO
              </>
            ) : (
              "Free"
            )}
          </Link>
        </div>
      )}

      {/* Credit soạn bài của giáo viên */}
      {config.role === "teacher" && balance !== null && (
        <span
          className={`inline-flex h-10 select-none items-center gap-1.5 rounded-full border bg-surface px-3.5 text-sm font-semibold shadow-xs [&>svg]:h-[17px] [&>svg]:w-[17px] ${
            balance <= 0 ? "border-danger/60 text-danger" : "border-border text-text"
          }`}
          title={t("teacher.topbar.credit")}
          aria-label={`${t("teacher.topbar.credit")}: ${balance}`}
        >
          <Icon name="zap" fill className={balance <= 0 ? "text-danger" : "text-primary-text"} />
          <span className="font-display tabular-nums">{balance}</span>
        </span>
      )}

      {/* Cụm 2: Tiện ích nhanh & Tài khoản — Ngôn ngữ gọn · Đổi sáng/tối · Thông báo · Avatar */}
      <div className="flex h-10 items-center gap-0.5 rounded-full border border-border bg-surface p-1 shadow-xs">
        <span className="hidden items-center sm:flex">
          <LanguageSwitcher variant="compact" />
          <span aria-hidden="true" className={DIVIDER} />
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t("theme.toggle")}
          title={isDark ? t("theme.toLight") : t("theme.toDark")}
          className={GROUP_BUTTON}
        >
          <Icon name={isDark ? "sun" : "moon"} />
        </button>
        <NotificationBell
          buttonClassName={GROUP_BUTTON}
          allHref={config.role === "student" ? "/student/notifications" : undefined}
        />
        <span aria-hidden="true" className={DIVIDER} />
        <AccountMenu config={config} compact />
      </div>
    </header>
  );
}
