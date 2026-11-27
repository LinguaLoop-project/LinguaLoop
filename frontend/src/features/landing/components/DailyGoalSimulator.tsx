import { useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";

type DailyMinutesOption = 10 | 15 | 20 | 30;

/** Định mức khớp chính xác với `DailyQuota.java` ở backend (BR-HT-24). */
const DAILY_QUOTAS: Record<DailyMinutesOption, { cards: number; sentencesPerMode: number }> = {
  10: { cards: 15, sentencesPerMode: 1 },
  15: { cards: 20, sentencesPerMode: 2 },
  20: { cards: 30, sentencesPerMode: 2 },
  30: { cards: 40, sentencesPerMode: 3 },
};

const OPTIONS: DailyMinutesOption[] = [10, 15, 20, 30];

/** Thanh mô phỏng Định mức ôn ngày (10 / 15 / 20 / 30 phút) nằm ngay cuối khối Vòng lặp 4 bước. */
export default function DailyGoalSimulator() {
  const { t } = useTranslation("landing");
  const [minutes, setMinutes] = useState<DailyMinutesOption>(15);
  const quota = DAILY_QUOTAS[minutes];

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-primary/25 bg-[linear-gradient(135deg,var(--surface),color-mix(in_srgb,var(--primary)_7%,var(--surface)))] p-6 shadow-[var(--shadow-card)] sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <Icon name="clock" className="text-base text-primary-text" />
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-text">
              {t("loop.simulator.eyebrow")}
            </span>
          </div>
          <h3 className="mt-1.5 font-display text-xl font-bold text-text sm:text-2xl">
            {t("loop.simulator.title")}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
            {t(`loop.simulator.plans.${minutes}`)}
          </p>
        </div>

        {/* Bộ chọn 4 mốc thời gian */}
        <div role="radiogroup" aria-label={t("loop.simulator.title")} className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => {
            const active = minutes === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMinutes(opt)}
                className={`inline-flex h-11 items-center gap-1.5 rounded-md border px-4 text-sm font-semibold transition-all ${
                  active
                    ? "border-primary bg-primary text-white shadow-[0_3px_0_color-mix(in_srgb,var(--primary)_55%,#000)]"
                    : "border-border-strong bg-bg-elevated text-text hover:bg-surface-hover"
                }`}
              >
                <span>{t("loop.simulator.minutesUnit", { count: opt })}</span>
                {opt === 15 && !active && (
                  <Badge variant="primary" className="!h-5 !px-1.5 !text-[10px]">
                    {t("loop.simulator.recommended")}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 chỉ số định mức cập nhật theo thời gian đã chọn */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-lg border border-border bg-bg-elevated/85 px-4 py-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-fn-vocab-soft text-lg text-fn-vocab">
            <Icon name="layers" />
          </span>
          <div>
            <div className="font-display text-2xl font-bold leading-none tabular-nums text-text">{quota.cards}</div>
            <div className="mt-1 text-xs font-medium text-text-muted">{t("loop.simulator.cardsLabel")}</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-lg border border-border bg-bg-elevated/85 px-4 py-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-fn-dictation-soft text-lg text-fn-dictation">
            <Icon name="headphones" />
          </span>
          <div>
            <div className="font-display text-2xl font-bold leading-none tabular-nums text-text">
              {quota.sentencesPerMode}
            </div>
            <div className="mt-1 text-xs font-medium text-text-muted">{t("loop.simulator.dictationLabel")}</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-lg border border-border bg-bg-elevated/85 px-4 py-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-fn-shadowing-soft text-lg text-fn-shadowing">
            <Icon name="mic" />
          </span>
          <div>
            <div className="font-display text-2xl font-bold leading-none tabular-nums text-text">
              {quota.sentencesPerMode}
            </div>
            <div className="mt-1 text-xs font-medium text-text-muted">{t("loop.simulator.shadowingLabel")}</div>
          </div>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-text-muted">
        <Icon name="flame" className="text-sm text-fn-vocab" />
        <span>{t("loop.simulator.note")}</span>
      </p>
    </div>
  );
}
