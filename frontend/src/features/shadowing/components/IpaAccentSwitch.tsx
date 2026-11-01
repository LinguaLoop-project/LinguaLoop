import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import type { IpaAccent } from "../utils";

const K = "student.shadowingPractice.accent";
const ACCENTS: IpaAccent[] = ["us", "uk"];

export interface IpaAccentSwitchProps {
  accent: IpaAccent;
  /** Giọng Anh được chọn nhưng câu chưa có phiên âm Anh, nên đang hiện phiên âm Mỹ. */
  ukMissing: boolean;
  onChange: (accent: IpaAccent) => void;
}

/**
 * Nút chuyển phiên âm hiển thị giữa Mỹ và Anh. Điểm luôn chấm theo giọng Mỹ, nên khi chọn Anh luôn hiện dòng giải
 * thích ngay dưới nút (không giấu trong tooltip) để người học không hiểu nhầm là đang được chấm theo giọng Anh.
 */
export default function IpaAccentSwitch({ accent, ukMissing, onChange }: IpaAccentSwitchProps) {
  const { t } = useTranslation("pages");
  const note = accent === "uk" ? t(ukMissing ? `${K}.noUk` : `${K}.ukNote`) : null;

  return (
    <div className="mt-1 flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-text-subtle">{t(`${K}.label`)}</span>
        <div role="group" aria-label={t(`${K}.label`)} className="inline-flex gap-0.5 rounded-md border border-border bg-surface p-0.5">
          {ACCENTS.map((value) => {
            const on = accent === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                aria-pressed={on}
                title={t(`${K}.${value}Title`)}
                className={`inline-flex h-7 cursor-pointer items-center rounded-sm border-0 px-3 text-xs transition-colors duration-150 ${
                  on
                    ? "bg-primary-soft font-semibold text-text shadow-[inset_0_0_0_1px_var(--border-strong)]"
                    : "bg-transparent font-medium text-text-muted hover:text-text"
                }`}
              >
                {t(`${K}.${value}`)}
              </button>
            );
          })}
        </div>
      </div>
      {note && (
        <p role="note" className="flex max-w-xl items-start gap-1.5 text-center text-xs text-text-subtle">
          <Icon name="info" className="mt-0.5 shrink-0 text-warning" />
          <span>{note}</span>
        </p>
      )}
    </div>
  );
}
