import { useTranslation } from "react-i18next";

const K = "student.tutor.switch";

export interface TutorSwitchProps {
  on: boolean;
  /** Free đã dùng hết phiên hôm nay: công tắc vẫn bật/tắt được nhưng gia sư không tự mời. */
  quotaOut?: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}

/** Công tắc Chế độ gia sư trên thanh đầu trang. */
export default function TutorSwitch({ on, quotaOut = false, disabled = false, onChange }: TutorSwitchProps) {
  const { t } = useTranslation("pages");
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border pl-2.5 pr-3.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 ${
        on
          ? "border-primary bg-primary-soft text-primary-text"
          : "border-border-strong bg-transparent text-text-muted hover:bg-surface-hover"
      }`}
    >
      <span aria-hidden className={`relative h-4 w-7 rounded-full transition-colors duration-150 ${on ? "bg-primary" : "bg-border-strong"}`}>
        <span
          className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-bg-base transition-transform duration-150 ${
            on ? "translate-x-3 !bg-white" : ""
          }`}
        />
      </span>
      {t(`${K}.label`)}: {t(on ? `${K}.on` : `${K}.off`)}
      {on && quotaOut && <span className="font-normal text-text-subtle">· {t(`${K}.quotaOut`)}</span>}
    </button>
  );
}
