import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { useAuth } from "@/features/auth";
import { useMyPlan } from "@/features/subscription/hooks/useMyPlan";
import { toggleTheme } from "@/hooks/useTheme";
import type { ShellConfig } from "./shellConfig";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

const ITEM =
  "flex w-full min-h-10 cursor-pointer items-center gap-2.5 rounded-sm border-0 bg-transparent px-3 text-left text-sm font-medium transition-colors duration-150 hover:bg-surface-hover";

/** Menu tài khoản dùng chung; mục riêng của từng vai trò lấy từ `config.menu`. */
/** `compact`: nút 32px để nằm trong cụm nút của thanh trên. */
export default function AccountMenu({ config, compact = false }: { config: ShellConfig; compact?: boolean }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const plan = useMyPlan(Boolean(config.menuPlanRow));
  const isPro = plan.data?.plan === "pro";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "";
  const email = user?.email ?? "";
  const avatarUrl = user?.avatarUrl ?? null;
  const emailUnverified = user ? !user.emailVerified : false;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`relative grid cursor-pointer select-none place-items-center overflow-hidden rounded-full bg-primary-soft font-bold text-primary-text transition-shadow hover:shadow-[0_0_0_2px_var(--primary-soft)] ${
          compact ? "h-8 w-8 text-xs" : "h-10 w-10 border border-border-strong text-sm"
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={t(config.accountAriaKey, { name: displayName })}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials(displayName)
        )}
      </button>

      {open && (
        <div
          id="account-menu"
          role="menu"
          aria-label={t(`${config.ns}.topbar.menuAria`)}
          className="absolute right-0 top-[48px] z-[70] flex w-[288px] animate-[menu-in_200ms_var(--ease-out)] flex-col gap-0.5 rounded-lg border border-border-strong bg-surface p-2 shadow-[0_24px_48px_-16px_rgba(0,0,0,.55),0_0_0_1px_var(--border)]"
        >
          <div className="flex items-center gap-3 px-2 pb-2.5 pt-1.5">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-border-strong bg-primary-soft text-sm font-bold text-primary-text"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials(displayName)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-sm font-semibold text-text">{displayName}</b>
              <div className="truncate text-xs text-text-muted">{email}</div>
            </div>
          </div>

          {config.menuPlanRow && (
            <>
              <button
                type="button"
                role="menuitem"
                className={`mx-1 flex min-h-10 w-[calc(100%-0.5rem)] cursor-pointer items-center justify-between gap-2.5 rounded-sm border px-3 text-left text-sm transition-colors ${
                  isPro
                    ? "border-warning/30 bg-warning/10 hover:bg-warning/15"
                    : "border-border bg-bg-elevated hover:border-primary/40 hover:bg-surface-hover"
                }`}
                onClick={() => {
                  setOpen(false);
                  navigate(isPro ? "/student/settings?tab=plan" : "/student/subscription");
                }}
              >
                {isPro ? (
                  <Badge variant="pro">
                    <Icon name="crown" fill />
                    PRO
                  </Badge>
                ) : (
                  <Badge>Free</Badge>
                )}
                <span className="flex-1 text-xs font-semibold text-text">
                  {t(isPro ? "student.topbar.managePlan" : "student.topbar.upgrade")}
                </span>
                <Icon name="arrow-right" className="text-sm text-text-muted" />
              </button>
              <hr className="my-1.5 border-0 border-t border-border" />
            </>
          )}

          {config.menu.map((item) => {
            const showVerifyDot = emailUnverified && item.to?.includes("tab=account");
            return (
              <button
                key={item.labelKey}
                type="button"
                role="menuitem"
                className={`${ITEM} text-text`}
                onClick={() => {
                  setOpen(false);
                  if (item.action === "theme") toggleTheme();
                  else if (item.to) navigate(item.to);
                }}
              >
                <Icon name={item.icon} className="text-[18px] text-text-muted" />
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
                {showVerifyDot && (
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-warning" />
                )}
              </button>
            );
          })}

          <hr className="my-1.5 border-0 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            className={`${ITEM} text-danger hover:bg-danger/10`}
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
          >
            <Icon name="log-out" className="text-[18px]" />
            {t(`${config.ns}.topbar.logout`)}
          </button>
        </div>
      )}
    </div>
  );
}
