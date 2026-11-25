import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import FormAlert from "@/components/common/FormAlert";
import SegmentedControl from "@/components/common/SegmentedControl";
import {
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

const CARD = "flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";
const STORAGE_KEYS = { dictation: DICTATION_KEY, shadowing: SHADOWING_KEY, watch: WATCH_KEY } as const;

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-text">{label}</span>
      {children}
      {hint && <p className="text-[13px] leading-normal text-text-subtle">{hint}</p>}
    </div>
  );
}

const rateOptions = (rates: readonly (number | string)[]) => rates.map((rate) => ({ value: String(rate), label: `${rate}x` }));

/**
 * Tab Luyện tập trong Cài đặt (UC-TK-10, BR-TK-20): chỉnh tốc độ, phiên âm, giọng và bản dịch mặc định cho Nghe chép,
 * Shadowing và Xem. Lưu trên trình duyệt này, có hiệu lực ngay, không cần bấm lưu.
 */
export default function PracticeSection() {
  const { t } = useTranslation("auth");
  const [prefs, setPrefs] = useState<PracticePrefs>(loadPracticePrefs);
  const [failed, setFailed] = useState(false);

  const onOff = [
    { value: "on", label: t("settings.practice.on") },
    { value: "off", label: t("settings.practice.off") },
  ];
  const flag = (value: boolean) => (value ? "on" : "off");

  const change = <K extends keyof PracticePrefs>(group: K, changes: Partial<PracticePrefs[K]>) => {
    setFailed(!savePracticePref(STORAGE_KEYS[group], changes as Record<string, unknown>));
    setPrefs((prev) => ({ ...prev, [group]: { ...prev[group], ...changes } }));
  };

  const toggle = (label: string, group: "dictation" | "shadowing" | "watch", field: string, value: boolean, hint?: string) => (
    <Row label={label} hint={hint}>
      <SegmentedControl options={onOff} value={flag(value)} ariaLabel={label} onChange={(next) => change(group, { [field]: next === "on" })} />
    </Row>
  );

  return (
    <div className="flex flex-col gap-6" id="v-practice">
      {failed && <FormAlert variant="danger">{t("settings.practice.saveFailed")}</FormAlert>}

      <section className={CARD}>
        <div>
          <h3 className="text-lg font-bold leading-[1.4]">{t("settings.practice.dictation.title")}</h3>
          <p className="mt-1 text-[13px] text-text-muted">{t("settings.practice.hint")}</p>
        </div>
        <Row label={t("settings.practice.rate")}>
          <SegmentedControl
            options={rateOptions(DICTATION_RATES)}
            value={String(prefs.dictation.rate)}
            ariaLabel={t("settings.practice.rate")}
            onChange={(value) => change("dictation", { rate: Number(value) })}
          />
        </Row>
        {toggle(t("settings.practice.translation"), "dictation", "showTranslation", prefs.dictation.showTranslation)}
        {toggle(t("settings.practice.dictation.autoNext"), "dictation", "autoNext", prefs.dictation.autoNext, t("settings.practice.dictation.autoNextHint"))}
      </section>

      <section className={CARD}>
        <h3 className="text-lg font-bold leading-[1.4]">{t("settings.practice.shadowing.title")}</h3>
        <Row label={t("settings.practice.rate")}>
          <SegmentedControl
            options={rateOptions(SHADOWING_RATES)}
            value={prefs.shadowing.rate}
            ariaLabel={t("settings.practice.rate")}
            onChange={(value) => change("shadowing", { rate: value })}
          />
        </Row>
        <Row label={t("settings.practice.accent")} hint={t("settings.practice.accentHint")}>
          <SegmentedControl
            options={[
              { value: "us", label: t("settings.practice.accentUs") },
              { value: "uk", label: t("settings.practice.accentUk") },
            ]}
            value={prefs.shadowing.accent}
            ariaLabel={t("settings.practice.accent")}
            onChange={(value) => change("shadowing", { accent: value === "uk" ? "uk" : "us" })}
          />
        </Row>
        {toggle(t("settings.practice.ipa"), "shadowing", "ipa", prefs.shadowing.ipa)}
        {toggle(t("settings.practice.translation"), "shadowing", "vi", prefs.shadowing.vi)}
      </section>

      <section className={CARD}>
        <h3 className="text-lg font-bold leading-[1.4]">{t("settings.practice.watch.title")}</h3>
        <Row label={t("settings.practice.rate")}>
          <SegmentedControl
            options={rateOptions(WATCH_RATES)}
            value={String(prefs.watch.rate)}
            ariaLabel={t("settings.practice.rate")}
            onChange={(value) => change("watch", { rate: Number(value) })}
          />
        </Row>
        {toggle(t("settings.practice.ipa"), "watch", "ipa", prefs.watch.ipa)}
        {toggle(t("settings.practice.translation"), "watch", "translation", prefs.watch.translation)}
      </section>
    </div>
  );
}
