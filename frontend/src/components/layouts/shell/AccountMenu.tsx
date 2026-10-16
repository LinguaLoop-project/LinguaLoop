import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { useAuth } from "@/features/auth";
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
  "flex w-full min-h-10 cursor-pointer items-center gap-2.5 rounded-sm border-0 bg-transparent px-3 text-left text-[15px] transition-colors duration-150 hover:bg-surface-hover";

/** Menu tài khoản dùng chung; mục riêng của từng vai trò lấy từ `config.menu`. */
export default function AccountMenu({ config }: { config: ShellConfig }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="grid h-10 w-10 cursor-pointer select-none place-items-center rounded-full border border-border-strong bg-primary-soft text-sm font-bold text-primary-text"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={t(config.accountAriaKey, { name: displayName })}
      >
        {initials(displayName)}
      </button>

      {open && (
        <div
          id="account-menu"
          role="menu"
          aria-label={t(`${config.ns}.topbar.menuAria`)}
          className="absolute right-0 top-[52px] z-[70] flex w-[300px] animate-[menu-in_200ms_var(--ease-out)] flex-col gap-0.5 rounded-lg border border-border-strong bg-surface p-2 shadow-[0_24px_48px_-16px_rgba(0,0,0,.55),0_0_0_1px_var(--border)]"
        >
          <div className="flex items-center gap-3 px-2 pb-3 pt-2">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border-strong bg-primary-soft text-sm font-bold text-primary-text"
            >
              {initials(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <b className="block truncate">{displayName}</b>
              <div className="truncate text-[13px] text-text-muted">{email}</div>
            </div>
          </div>

          {config.menuPlanRow && (
            <>
              <button
                type="button"
                role="menuitem"
                className="mx-1 flex min-h-10 w-[calc(100%-0.5rem)] cursor-pointer items-center justify-between gap-2.5 rounded-sm border border-border bg-transparent px-3 text-left text-[15px] hover:bg-surface-hover"
                onClick={() => {
                  setOpen(false);
                  navigate("/student/settings?tab=plan");
                }}
              >
                <span className="inline-flex h-6 items-center rounded-sm bg-[color-mix(in_srgb,var(--text-muted)_14%,transparent)] px-2 text-xs font-semibold text-text-muted">Free</span>
                <span className="text-[13px]">{t("student.topbar.upgrade")}</span>
                <Icon name="arrow-right" />
              </button>
              <hr className="my-1 border-0 border-t border-border" />
            </>
          )}

          {config.menu.map((item) => (
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
              <Icon name={item.icon} className="text-lg" />
              {t(item.labelKey)}
            </button>
          ))}

          <hr className="my-1 border-0 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            className={`${ITEM} text-danger`}
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
          >
            <Icon name="log-out" className="text-lg" />
            {t(`${config.ns}.topbar.logout`)}
          </button>
        </div>
      )}
    </div>
  );
}
