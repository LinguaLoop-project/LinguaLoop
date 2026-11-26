import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import FormAlert from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import SegmentedControl from "@/components/common/SegmentedControl";
import Switch from "@/components/common/Switch";
import { toast } from "@/stores/toastStore";
import {
  DEFAULT_PRACTICE_PREFS,
  DICTATION_KEY,
  DICTATION_RATES,
  SHADOWING_KEY,
  SHADOWING_RATES,
  WATCH_KEY,
  WATCH_RATES,
  loadPracticePrefs,
  savePracticePref,
  type PracticePrefs,
} from "../practicePrefs";
import { SettingRow, SettingsCard } from "./SettingsCard";

const STORAGE_KEYS = { dictation: DICTATION_KEY, shadowing: SHADOWING_KEY, watch: WATCH_KEY } as const;

const rateOptions = (rates: readonly (number | string)[]) =>
  rates.map((rate) => ({ value: String(rate), label: `${rate}x` }));

function isDefaultPrefs(prefs: PracticePrefs): boolean {
  const def = DEFAULT_PRACTICE_PREFS;
  return (
    prefs.dictation.rate === def.dictation.rate &&
    prefs.dictation.autoNext === def.dictation.autoNext &&
    prefs.dictation.showTranslation === def.dictation.showTranslation &&
    prefs.shadowing.rate === def.shadowing.rate &&
    prefs.shadowing.ipa === def.shadowing.ipa &&
    prefs.shadowing.accent === def.shadowing.accent &&
    prefs.shadowing.vi === def.shadowing.vi &&
    prefs.watch.rate === def.watch.rate &&
    prefs.watch.ipa === def.watch.ipa &&
    prefs.watch.translation === def.watch.translation
  );
}

/**
 * Tab Luyện tập trong Cài đặt (UC-TK-10, BR-TK-20): chỉnh tốc độ, phiên âm, giọng và bản dịch mặc định cho Nghe chép,
 * Shadowing và Xem. Lưu trên trình duyệt này, có hiệu lực ngay, không cần bấm lưu.
 */
export default function PracticeSection() {
  const { t } = useTranslation("auth");
  const baseId = useId();
  const [prefs, setPrefs] = useState<PracticePrefs>(loadPracticePrefs);
  const [failed, setFailed] = useState(false);

  const isDefault = isDefaultPrefs(prefs);

  const change = <K extends keyof PracticePrefs>(group: K, changes: Partial<PracticePrefs[K]>) => {
    const ok = savePracticePref(STORAGE_KEYS[group], changes as Record<string, unknown>);
    setFailed(!ok);
    setPrefs((prev) => ({ ...prev, [group]: { ...prev[group], ...changes } }));
  };

  const resetAll = () => {
    const okDict = savePracticePref(DICTATION_KEY, DEFAULT_PRACTICE_PREFS.dictation);
    const okShad = savePracticePref(SHADOWING_KEY, DEFAULT_PRACTICE_PREFS.shadowing);
    const okWatch = savePracticePref(WATCH_KEY, DEFAULT_PRACTICE_PREFS.watch);
    const ok = okDict && okShad && okWatch;
    setFailed(!ok);
    setPrefs({
      dictation: { ...DEFAULT_PRACTICE_PREFS.dictation },
      shadowing: { ...DEFAULT_PRACTICE_PREFS.shadowing },
      watch: { ...DEFAULT_PRACTICE_PREFS.watch },
    });
    if (ok) toast(t("settings.practice.resetDone"), { icon: "rotate-ccw" });
  };

  const toggleRow = (
    key: string,
    label: string,
    group: "dictation" | "shadowing" | "watch",
    field: string,
    value: boolean,
    hint?: string,
  ) => {
    const labelId = `${baseId}-${group}-${key}`;
    return (
      <SettingRow label={label} hint={hint} labelId={labelId}>
        <Switch
          checked={value}
          ariaLabel={label}
          ariaLabelledBy={labelId}
          onChange={(next) => change(group, { [field]: next })}
        />
      </SettingRow>
    );
  };

  return (
    <div className="flex flex-col gap-6" id="v-practice">
      {/* Thanh thông tin lưu tự động chung cho cả 3 chế độ + nút đặt lại mặc định */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-[13px] text-text-muted shadow-[var(--shadow-card)]">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Icon name="sliders-horizontal" className="shrink-0 text-base text-primary-text" />
          <span>{t("settings.practice.hint")}</span>
        </div>
        {!isDefault && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="rotate-ccw" />}
            onClick={resetAll}
          >
            {t("settings.resetDefault")}
          </Button>
        )}
      </div>

      {failed && <FormAlert variant="danger">{t("settings.practice.saveFailed")}</FormAlert>}

      <SettingsCard
        title={t("settings.practice.dictation.title")}
        description={t("settings.practice.dictation.desc")}
        icon="headphones"
        tone="dictation"
      >
        <div className="divide-y divide-border/70">
          <SettingRow label={t("settings.practice.rate")}>
            <SegmentedControl
              options={rateOptions(DICTATION_RATES)}
              value={String(prefs.dictation.rate)}
              ariaLabel={t("settings.practice.rate")}
              onChange={(value) => change("dictation", { rate: Number(value) })}
            />
          </SettingRow>
          {toggleRow("translation", t("settings.practice.translation"), "dictation", "showTranslation", prefs.dictation.showTranslation)}
          {toggleRow(
            "autoNext",
            t("settings.practice.dictation.autoNext"),
            "dictation",
            "autoNext",
            prefs.dictation.autoNext,
            t("settings.practice.dictation.autoNextHint"),
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("settings.practice.shadowing.title")}
        description={t("settings.practice.shadowing.desc")}
        icon="mic"
        tone="shadowing"
      >
        <div className="divide-y divide-border/70">
          <SettingRow label={t("settings.practice.rate")}>
            <SegmentedControl
              options={rateOptions(SHADOWING_RATES)}
              value={prefs.shadowing.rate}
              ariaLabel={t("settings.practice.rate")}
              onChange={(value) => change("shadowing", { rate: value })}
            />
          </SettingRow>
          <SettingRow label={t("settings.practice.accent")} hint={t("settings.practice.accentHint")}>
            <SegmentedControl
              options={[
                { value: "us", label: t("settings.practice.accentUs") },
                { value: "uk", label: t("settings.practice.accentUk") },
              ]}
              value={prefs.shadowing.accent}
              ariaLabel={t("settings.practice.accent")}
              onChange={(value) => change("shadowing", { accent: value === "uk" ? "uk" : "us" })}
            />
          </SettingRow>
          {toggleRow("ipa", t("settings.practice.ipa"), "shadowing", "ipa", prefs.shadowing.ipa)}
          {toggleRow("vi", t("settings.practice.translation"), "shadowing", "vi", prefs.shadowing.vi)}
        </div>
      </SettingsCard>

      <SettingsCard
        title={t("settings.practice.watch.title")}
        description={t("settings.practice.watch.desc")}
        icon="monitor-play"
        tone="watch"
      >
        <div className="divide-y divide-border/70">
          <SettingRow label={t("settings.practice.rate")}>
            <SegmentedControl
              options={rateOptions(WATCH_RATES)}
              value={String(prefs.watch.rate)}
              ariaLabel={t("settings.practice.rate")}
              onChange={(value) => change("watch", { rate: Number(value) })}
            />
          </SettingRow>
          {toggleRow("ipa", t("settings.practice.ipa"), "watch", "ipa", prefs.watch.ipa)}
          {toggleRow("translation", t("settings.practice.translation"), "watch", "translation", prefs.watch.translation)}
        </div>
      </SettingsCard>
    </div>
  );
}
