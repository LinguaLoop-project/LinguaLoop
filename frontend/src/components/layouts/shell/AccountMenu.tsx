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
  "flex w-full min-h-[40px] cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-2.5 text-left text-sm font-medium transition-colors duration-150";

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
        className="grid h-10 w-10 cursor-pointer select-none place-items-center rounded-full border border-border-strong bg-primary-soft text-sm font-semibold text-text transition-colors hover:bg-surface-hover"
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
          className="absolute right-0 top-[calc(100%+8px)] z-50 flex min-w-[260px] flex-col gap-0.5 rounded-lg border border-border-strong bg-surface p-2 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center gap-3 p-2 pb-3">
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border-strong bg-primary-soft text-base font-semibold text-text"
            >
              {initials(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-sm font-bold text-text">{displayName}</b>
              <div className="truncate text-xs text-text-muted">{email}</div>
            </div>
          </div>

          {config.menuPlanRow && (
            <>
              <button
                type="button"
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-border bg-surface-hover p-2.5 text-sm font-medium text-text transition-colors hover:border-border-strong"
                onClick={() => {
                  setOpen(false);
                  navigate("/student/settings?tab=plan");
                }}
              >
                <span className="inline-flex items-center rounded border border-border-strong bg-surface px-2 py-0.5 text-[11px] font-bold text-text-muted">
                  Free
                </span>
                <span className="text-xs font-semibold text-primary-text">{t("student.topbar.upgrade")}</span>
                <Icon name="arrow-right" className="ml-auto text-sm text-text-subtle" />
              </button>
              <hr className="-mx-2 my-1.5 border-0 border-t border-border" />
            </>
          )}

          {config.menu.map((item) => (
            <button
              key={item.labelKey}
              type="button"
              role="menuitem"
              className={`${ITEM} text-text-muted hover:bg-surface-hover hover:text-text`}
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

          <hr className="-mx-2 my-1.5 border-0 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            className={`${ITEM} text-danger hover:bg-danger/10`}
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
