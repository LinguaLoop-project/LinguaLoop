import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Popover from "./Popover";

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded-[6px] border border-border-strong bg-bg-elevated px-1.5 py-1 text-[11px] font-semibold leading-none text-text-muted">
    {children}
  </kbd>
);

/** Bảng phím tắt (`#dKeyPop`). */
export default function ShortcutsPopover() {
  const { t } = useTranslation("dictation");
  const rows: [string, ReactNode][] = [
    [t("shortcuts.play"), <Kbd key="ctrl">{t("shortcuts.playKeys")}</Kbd>],
    [t("shortcuts.submit"), <Kbd key="enter">Enter</Kbd>],
    [
      t("shortcuts.newline"),
      <span key="nl" className="flex gap-1">
        <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd>
      </span>,
    ],
    [
      t("shortcuts.prevNext"),
      <span key="pn" className="flex gap-1">
        <Kbd>Alt</Kbd>+<Kbd>←</Kbd>
        <Kbd>→</Kbd>
      </span>,
    ],
    [t("shortcuts.cloze"), <span key="cz" className="text-xs text-text-muted">{t("shortcuts.clozeKeys")}</span>],
    [t("shortcuts.note"), <Kbd key="note">N</Kbd>],
    [
      t("shortcuts.level"),
      <span key="lv" className="flex gap-1">
        <Kbd>Alt</Kbd>+<Kbd>1</Kbd>
        <Kbd>2</Kbd>
        <Kbd>3</Kbd>
      </span>,
    ],
  ];
  return (
    <Popover label={t("shortcuts.open")} icon="keyboard">
      <div className="font-bold">{t("shortcuts.title")}</div>
      {rows.map(([name, keys]) => (
        <div key={name} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-text-muted">{name}</span>
          {keys}
        </div>
      ))}
    </Popover>
  );
}
