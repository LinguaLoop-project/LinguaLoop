import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import {
  detectTimezone,
  formatTimezoneName,
  formatTimezoneOffset,
  formatTimezoneTime,
  timezoneOptions,
} from "../timezones";

export interface TimezonePickerProps {
  id: string;
  value: string;
  onChange: (zone: string) => void;
  error?: string;
  hint?: string;
}

interface ZoneEntry {
  zone: string;
  label: string;
  offset: string;
  searchKey: string;
}

/** Bộ chọn múi giờ có tìm kiếm, hiển thị độ lệch UTC, giờ địa phương và nút chọn nhanh múi giờ thiết bị. */
export default function TimezonePicker({ id, value, onChange, error, hint }: TimezonePickerProps) {
  const { t } = useTranslation("auth");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const deviceZone = useMemo(() => detectTimezone(), []);

  const entries = useMemo<ZoneEntry[]>(() => {
    const now = new Date();
    return timezoneOptions(value).map((zone) => {
      const label = formatTimezoneName(zone);
      const offset = formatTimezoneOffset(zone, now);
      return {
        zone,
        label,
        offset,
        searchKey: `${zone} ${label} ${offset}`.toLowerCase(),
      };
    });
  }, [value]);

  const selectedEntry = useMemo(
    () => entries.find((e) => e.zone === value) ?? { zone: value, label: formatTimezoneName(value), offset: formatTimezoneOffset(value), searchKey: "" },
    [entries, value],
  );

  const localTime = formatTimezoneTime(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.searchKey.includes(q));
  }, [entries, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
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

  const canUseDevice = Boolean(deviceZone && deviceZone !== value);

  const selectZone = (zone: string) => {
    onChange(zone);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-text">
          {t("learningProfile.timezone")}
        </label>
        {canUseDevice && deviceZone && (
          <button
            type="button"
            onClick={() => selectZone(deviceZone)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-text transition-colors hover:border-primary/60"
          >
            <Icon name="crosshair" className="text-xs" />
            {t("learningProfile.useDeviceTimezone", { zone: deviceZone })}
          </button>
        )}
      </div>

      <div className="relative">
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          onClick={() => setOpen((v) => !v)}
          className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-md border bg-bg-elevated px-3.5 py-2 text-left text-[15px] text-text transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--primary-soft)] ${
            error
              ? "border-danger"
              : open
                ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]"
                : "border-border-strong hover:border-primary/50"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Icon name="globe" className="shrink-0 text-lg text-primary-text" />
            <span className="min-w-0 truncate font-medium">{selectedEntry.label}</span>
            {selectedEntry.offset && (
              <span className="hidden shrink-0 rounded-sm bg-surface-hover px-1.5 py-0.5 font-mono text-xs text-text-muted sm:inline-block">
                {selectedEntry.offset}
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-text-muted">
            {localTime && (
              <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums">
                <Icon name="clock" className="text-xs" />
                {localTime}
              </span>
            )}
            <Icon name={open ? "chevron-up" : "chevron-down"} className="text-base" />
          </span>
        </button>

        {open && (
          <div
            role="dialog"
            aria-label={t("learningProfile.timezone")}
            className="absolute left-0 right-0 top-full z-30 mt-1.5 flex animate-[menu-in_150ms_var(--ease-out)] flex-col overflow-hidden rounded-md border border-border-strong bg-surface shadow-[0_20px_44px_-16px_rgba(0,0,0,0.45)]"
          >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Icon name="search" className="shrink-0 text-base text-text-muted" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("learningProfile.timezoneSearch")}
              aria-label={t("learningProfile.timezoneSearch")}
              className="w-full bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label={t("learningProfile.timezoneClear")}
                onClick={() => setQuery("")}
                className="grid size-6 shrink-0 place-items-center rounded-sm text-text-muted hover:bg-surface-hover hover:text-text"
              >
                <Icon name="x" className="text-sm" />
              </button>
            )}
          </div>

          <div role="listbox" aria-label={t("learningProfile.timezone")} className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-text-muted">{t("learningProfile.timezoneEmpty")}</p>
            ) : (
              filtered.map((entry) => {
                const active = entry.zone === value;
                return (
                  <button
                    key={entry.zone}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectZone(entry.zone)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-primary-soft font-semibold text-text"
                        : "text-text-muted hover:bg-surface-hover hover:text-text"
                    }`}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{entry.label}</span>
                      <span className="truncate text-xs text-text-subtle">{entry.zone}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {entry.offset && <span className="font-mono text-xs text-text-subtle">{entry.offset}</span>}
                      {active && <Icon name="check" className="text-base text-primary-text" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
        )}
      </div>

      <p className={`text-[13px] leading-normal ${error ? "text-danger" : "text-text-subtle"}`}>
        {error ?? hint}
      </p>
    </div>
  );
}
