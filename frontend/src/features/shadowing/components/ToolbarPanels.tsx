import { useTranslation } from "react-i18next";
import type { ShadowingSettings } from "../hooks/useShadowingSettings";

const K = "student.shadowingPractice";

type ToggleKey = "ipa" | "vi" | "subs";
const TOGGLES: ToggleKey[] = ["ipa", "vi", "subs"];

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: ShadowingSettings;
  onChange: (patch: Partial<ShadowingSettings>) => void;
}) {
  const { t } = useTranslation("pages");
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-base font-bold">{t(`${K}.settings.title`)}</h3>
      {TOGGLES.map((key) => (
        <label key={key} className="flex cursor-pointer items-start justify-between gap-3">
          <span className="flex flex-col">
            <b className="text-sm">{t(`${K}.settings.${key}.label`)}</b>
            <span className="text-xs text-text-muted">{t(`${K}.settings.${key}.hint`)}</span>
          </span>
          <input
            type="checkbox"
            checked={settings[key]}
            onChange={(e) => onChange({ [key]: e.target.checked })}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
          />
        </label>
      ))}
    </div>
  );
}

const SHORTCUTS: { id: string; keys: string[][] }[] = [
  { id: "record", keys: [["Space"]] },
  { id: "model", keys: [["Ctrl"]] },
  { id: "mine", keys: [["R"]] },
  { id: "compare", keys: [["C"]] },
  { id: "step", keys: [["Alt", "←"], ["Alt", "→"]] },
  { id: "tabs", keys: [["Alt", "W"], ["Alt", "P"]] },
];

export function ShortcutsPanel() {
  const { t } = useTranslation("pages");
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-base font-bold">{t(`${K}.shortcuts.title`)}</h3>
      <ul className="flex flex-col gap-2 text-sm">
        {SHORTCUTS.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3">
            <span className="text-text-muted">{t(`${K}.shortcuts.${s.id}`)}</span>
            <span className="flex flex-wrap justify-end gap-1.5">
              {s.keys.map((combo) => (
                <span key={combo.join("+")} className="inline-flex items-center gap-1">
                  {combo.map((k, i) => (
                    <span key={k} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-text-subtle">+</span>}
                      <kbd className="rounded-md border border-border-strong bg-bg-elevated px-1.5 py-0.5 font-body text-xs font-semibold">
                        {k}
                      </kbd>
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
