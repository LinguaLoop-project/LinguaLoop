import { useTranslation } from "react-i18next";
import type { DictationSettings } from "../types";
import Popover from "./Popover";

export interface SettingsPopoverProps {
  settings: DictationSettings;
  onChange: (patch: Partial<DictationSettings>) => void;
}

interface SwitchRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SwitchRow = ({ title, description, checked, onChange }: SwitchRowProps) => (
  <label className="flex cursor-pointer items-center justify-between gap-3">
    <span className="flex flex-col gap-0.5">
      <b className="text-sm">{title}</b>
      <span className="text-xs text-text-muted">{description}</span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-[18px] w-[18px] flex-none accent-fn-dictation"
    />
  </label>
);

/** Cài đặt nghe chép (`#dSetPop`): tự phát câu tiếp và hiện bản dịch. */
export default function SettingsPopover({ settings, onChange }: SettingsPopoverProps) {
  const { t } = useTranslation("dictation");
  return (
    <Popover label={t("settings.open")} icon="settings">
      <div className="font-bold">{t("settings.title")}</div>
      <SwitchRow
        title={t("settings.autoNext")}
        description={t("settings.autoNextDesc")}
        checked={settings.autoNext}
        onChange={(autoNext) => onChange({ autoNext })}
      />
      <SwitchRow
        title={t("settings.translation")}
        description={t("settings.translationDesc")}
        checked={settings.showTranslation}
        onChange={(showTranslation) => onChange({ showTranslation })}
      />
    </Popover>
  );
}
