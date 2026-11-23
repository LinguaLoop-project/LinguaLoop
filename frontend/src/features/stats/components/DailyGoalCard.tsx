import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import ProgressRing from "@/components/common/ProgressRing";
import { buttonClasses } from "@/components/common/buttonStyles";
import { useTodayGoal } from "../hooks";
import { goalPercent } from "../utils";

/**
 * Vòng tiến độ mục tiêu câu luyện hôm nay (BR-TH-18). Là thẻ phụ của trang Hôm nay nên khi chưa tải được thì ẩn đi
 * thay vì chặn cả trang.
 */
export default function DailyGoalCard() {
  const { t } = useTranslation("stats");
  const { data } = useTodayGoal();
  if (!data) return null;

  const reached = data.sentences >= data.target;
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <ProgressRing
        value={goalPercent(data.sentences, data.target)}
        size={80}
        tone={reached ? "success" : "primary"}
        label="%"
        ariaLabel={t("goal.aria")}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-primary-text">{t("goal.title")}</h2>
        <p className="font-display text-2xl font-bold tabular-nums">{t("goal.progress", { done: data.sentences, target: data.target })}</p>
        <p className="text-[13px] text-text-muted">
          {reached ? t("goal.reached") : t("goal.remaining", { count: data.target - data.sentences })}{" "}
          <Link to="/student/settings" className="font-semibold text-primary-text hover:underline">
            {t("goal.change")}
          </Link>
        </p>
      </div>
      {!reached && (
        <Link to="/student/dictation" className={buttonClasses({ variant: "secondary", size: "sm" })}>
          <Icon name="headphones" />
          {t("goal.practice")}
        </Link>
      )}
    </section>
  );
}
