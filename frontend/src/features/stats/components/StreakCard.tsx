import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import type { Streak } from "../types";

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** Chuỗi ngày học: số ngày hiện tại, kỷ lục, 7 ngày của tuần và lời nhắc giữ chuỗi (BR-TH-02). */
export default function StreakCard({ streak }: { streak: Streak }) {
  const { t } = useTranslation("stats");
  const message = streak.studiedToday
    ? t("streak.doneToday")
    : streak.current > 0
      ? t("streak.keepIt", { count: streak.current })
      : t("streak.start");

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-primary-text">
        <Icon name="flame" className="size-4" />
        {t("streak.title")}
      </h2>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-4xl font-bold leading-none tabular-nums">
          {t("streak.days", { count: streak.current })}
        </span>
        <span className="text-sm text-text-muted">
          {streak.longest > 0 ? t("streak.longest", { count: streak.longest }) : t("streak.noRecord")}
        </span>
      </div>

      <ul className="mt-4 grid grid-cols-7 gap-1.5" aria-label={t("streak.weekAria")}>
        {WEEKDAYS.map((day, index) => {
          const studied = streak.week[index] === true;
          const today = index === streak.todayIndex;
          return (
            <li key={day} className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-text-muted">{t(`streak.weekdays.${day}`)}</span>
              <span
                className={`grid size-9 place-items-center rounded-full border text-sm ${
                  studied ? "border-success/40 bg-success/15 text-success" : "border-border bg-bg-elevated text-text-subtle"
                } ${today ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : ""}`}
              >
                {studied ? <Icon name="check" className="size-4" /> : null}
                <span className="sr-only">{studied ? t("streak.studied") : t("streak.notStudied")}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-muted">{message}</p>
    </section>
  );
}
