import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { useAuthStore } from "@/features/auth";
import SuggestionCards from "../components/SuggestionCards";
import { hasSuggestions } from "../flow";
import { useDailyPlan } from "../hooks";
import type { DailyPlan } from "../types";

function Stat({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-md border border-border bg-surface-hover px-4 py-3">
      <Icon name={icon} className="text-2xl text-primary-text" />
      <div className="flex flex-col leading-tight">
        <b className="font-display text-2xl">{value}</b>
        <span className="text-[13px] text-text-muted">{label}</span>
      </div>
    </div>
  );
}

function ReviewCard({ plan }: { plan: DailyPlan }) {
  const { t, i18n } = useTranslation("review");
  const hasWork = plan.cardsInPlan > 0 || plan.sentences.length > 0;
  const suggestions = hasSuggestions(plan.suggestions) ? plan.suggestions : null;
  const next = plan.nextCardDueAt
    ? t("empty.nextDue", {
        time: new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.nextCardDueAt)),
      })
    : t("empty.nextNone");

  return (
    <div className="flex flex-col gap-5 rounded-lg border-2 border-primary bg-surface p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <Mascot mood={hasWork ? "hello" : "celebrate"} size={88} alt="" className="hidden sm:block" />
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold">{hasWork ? t("today.reviewTitle") : t("today.doneTitle")}</h2>
          <p className="mt-1 text-text-muted">
            {hasWork
              ? t("today.reviewDesc", { cards: plan.cardsInPlan, sentences: plan.sentences.length })
              : `${t("today.doneDesc")} ${next}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Stat icon="layers" value={plan.cardsDue} label={t("today.cardsDue")} />
        <Stat icon="mic" value={plan.sentencesPending} label={t("today.sentencesPending")} />
        <Stat icon="target" value={t("today.minutes", { count: plan.dailyMinutes })} label={t("today.goal")} />
      </div>

      {hasWork ? (
        <div className="flex flex-wrap gap-2">
          <Link to="/student/review/daily" className={buttonClasses({ variant: "primary", size: "lg" })}>
            <Icon name="play" />
            {t("today.start")}
          </Link>
          <Link to="/student/lessons" className={buttonClasses({ variant: "ghost", size: "lg" })}>
            {t("empty.practiceLessons")}
          </Link>
        </div>
      ) : suggestions ? (
        <SuggestionCards suggestions={suggestions} dailyMinutes={plan.dailyMinutes} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link to="/student/vocab" className={buttonClasses({ variant: "primary", size: "lg" })}>
            <Icon name="layers" />
            {t("empty.learnNew")}
          </Link>
          <Link to="/student/lessons" className={buttonClasses({ variant: "ghost", size: "lg" })}>
            {t("empty.practiceLessons")}
          </Link>
        </div>
      )}
    </div>
  );
}

/** Trang "Hôm nay" (đích sau onboarding): mục tiêu ngày, việc cần ôn và nút bắt đầu Ôn tập hôm nay (UC-HT-05). */
export default function TodayPage() {
  const { t } = useTranslation("review");
  const name = useAuthStore((state) => state.user?.displayName);
  const query = useDailyPlan(0);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header>
        <span className="block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">
          {t("today.overline")}
        </span>
        <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">
          {name ? t("today.greeting", { name }) : t("today.greetingAnon")}
        </h1>
      </header>

      {query.isPending && (
        <div role="status" aria-label={t("loading")}>
          <Skeleton className="h-[240px] rounded-lg" />
        </div>
      )}
      {query.isError && (
        <ErrorState
          kind={isAxiosError(query.error) && !query.error.response ? "network" : "server"}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}
      {query.isSuccess && <ReviewCard plan={query.data} />}
    </section>
  );
}
