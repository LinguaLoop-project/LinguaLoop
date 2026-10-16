import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { toggleTheme } from "@/hooks/useTheme";
import type { ShellConfig } from "./shellConfig";

type Item = { id: string; icon: string; label: string; run: () => void };

/** Ô tìm nhanh Ctrl K (`.palette` trong mockup v2): đi tới màn hình và thao tác; ↑↓ chọn, Enter chạy, Esc đóng. */
export default function CommandPalette({ config, open, onOpenChange }: { config: ShellConfig; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  // Ctrl/⌘ K mở từ bất kỳ đâu; "/" mở khi không đang gõ vào ô nhập
  useEffect(() => {
    if (config.topBar.kind !== "learner") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement | null)?.tagName ?? "");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [config.topBar.kind, onOpenChange]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setSelected(0);
  };

  const { screens, actions } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const go = (to: string) => () => navigate(to);
    const screens: Item[] = config.groups
      .flatMap((g) => g.items)
      .map((i) => ({ id: i.id, icon: i.icon, label: t(i.labelKey), run: go(i.to) }))
      .filter((i) => !q || i.label.toLowerCase().includes(q));
    const actions: Item[] = [{ id: "theme", icon: "contrast", label: t("theme.toggle"), run: toggleTheme }].filter((a) => !q || a.label.toLowerCase().includes(q));
    return { screens, actions };
  }, [config.groups, navigate, query, t]);

  if (!open) return null;
  const items = [...screens, ...actions];
  const run = (item?: Item) => {
    if (!item) return;
    close();
    item.run();
  };

  const row = (item: Item, index: number) => (
    <button
      key={item.id}
      type="button"
      onClick={() => run(item)}
      onMouseEnter={() => setSelected(index)}
      className={`flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-sm border-0 px-2.5 text-left ${index === selected ? "bg-primary-soft" : "bg-transparent"}`}
    >
      <Icon name={item.icon} className="text-xl" />
      {item.label}
    </button>
  );

  return (
    <>
      <button type="button" aria-label={t("shell.closeMenu")} onClick={close} className="fixed inset-0 z-[80] cursor-default border-0 bg-[rgba(7,5,13,.55)]" />
      <div
        role="dialog"
        aria-label={t("shell.palette.label")}
        className="fixed left-1/2 top-[14vh] z-[90] w-[min(620px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[0_24px_48px_-16px_rgba(0,0,0,.55),0_0_0_1px_var(--border)]"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (items.length) setSelected((s) => (s + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            run(items[selected]);
          }
        }}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <Icon name="search" className="text-xl text-text-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            placeholder={t("shell.palette.placeholder")}
            aria-label={t("shell.palette.label")}
            autoComplete="off"
            className="flex-1 border-0 bg-transparent text-base text-text outline-none placeholder:text-text-subtle"
          />
        </div>
        <div className="max-h-[52vh] overflow-auto p-2">
          {screens.length > 0 && (
            <>
              <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-text">{t("shell.palette.goTo")}</div>
              {screens.map((s, i) => row(s, i))}
            </>
          )}
          {actions.length > 0 && (
            <>
              <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-text">{t("shell.palette.actions")}</div>
              {actions.map((a, i) => row(a, screens.length + i))}
            </>
          )}
          {items.length === 0 && <div className="p-4 text-[13px] text-text-muted">{t("shell.palette.none", { q: query })}</div>}
        </div>
      </div>
    </>
  );
}
