import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import Badge from "@/components/common/Badge";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import ProgressBar, { type ProgressTone } from "@/components/common/ProgressBar";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { useAuthStore } from "@/features/auth";
import { useLessonSearch } from "@/features/lesson";
import { StatsDashboard, useStreak, type Streak } from "@/features/stats";
import CardSourceChips from "../components/CardSourceChips";
import SuggestionCards from "../components/SuggestionCards";
import { hasSuggestions } from "../flow";
import { useDailyPlan } from "../hooks";
import type { DailyPlan } from "../types";

const STAT_TONE: Record<ProgressTone, { shell: string; icon: string }> = {
  primary: { shell: "bg-primary-soft text-primary-text", icon: "text-primary-text" },
  vocab: { shell: "bg-fn-vocab-soft text-fn-vocab", icon: "text-fn-vocab" },
  shadowing: { shell: "bg-fn-shadowing-soft text-fn-shadowing", icon: "text-fn-shadowing" },
  dictation: { shell: "bg-fn-dictation-soft text-fn-dictation", icon: "text-fn-dictation" },
  assessment: { shell: "bg-fn-assessment-soft text-fn-assessment", icon: "text-fn-assessment" },
  success: { shell: "bg-success/15 text-success", icon: "text-success" },
};

interface StatProps {
  icon: string;
  value: number | string;
  label: string;
  tone?: ProgressTone;
  progress?: number;
  subLabel?: string;
  actionTo?: string;
  actionLabel?: string;
}

function Stat({ icon, value, label, tone = "primary", progress, subLabel, actionTo, actionLabel }: StatProps) {
  const palette = STAT_TONE[tone];
  return (
    <div className="flex min-w-[200px] flex-1 flex-col justify-between gap-2.5 rounded-lg border border-border bg-surface-hover/70 px-4 py-3.5 transition-colors hover:border-border-strong">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${palette.shell}`}>
          <Icon name={icon} className={`text-xl ${palette.icon}`} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <div className="flex items-baseline justify-between gap-2">
            <b className="font-display text-2xl tabular-nums">{value}</b>
            {actionTo && actionLabel && (
              <Link
                to={actionTo}
                className="inline-flex items-center gap-1 text-xs font-semibold text-fn-shadowing hover:underline"
              >
                {actionLabel}
                <Icon name="arrow-right" className="size-3" />
              </Link>
            )}
          </div>
          <span className="text-[13px] text-text-muted">{label}</span>
        </div>
      </div>
      {progress !== undefined && <ProgressBar value={progress} tone={tone} thin label={label} />}
      {subLabel && <span className="text-xs text-text-subtle">{subLabel}</span>}
    </div>
  );
}

/**
 * Tiến độ Định mức ôn ngày (BR-HT-24): "đã ôn/mục tiêu" kèm thanh tiến độ. Hôm nay không có việc nào để ôn (mục tiêu 0)
 * thì chỉ báo số đang đến hạn.
 */
function QuotaStat({
  icon,
  done,
  target,
  doneLabel,
  idleLabel,
  tone,
  actionTo,
  actionLabel,
}: {
  icon: string;
  done: number;
  target: number;
  doneLabel: string;
  idleLabel: string;
  tone: ProgressTone;
  actionTo?: string;
  actionLabel?: string;
}) {
  if (target === 0) {
    return <Stat icon={icon} value={0} label={idleLabel} tone={tone} actionTo={actionTo} actionLabel={actionLabel} />;
  }
  const reached = done >= target;
  return (
    <Stat
      icon={icon}
      value={`${done}/${target}`}
      label={doneLabel}
      tone={reached ? "success" : tone}
      progress={(done / target) * 100}
      actionTo={actionTo}
      actionLabel={actionLabel}
    />
  );
}

function QuickExploreCards() {
  const { t } = useTranslation("review");
  const items = [
    {
      to: "/student/vocab",
      icon: "layers",
      iconShell: "bg-fn-vocab-soft text-fn-vocab",
      accent: "hover:border-fn-vocab/50",
      title: t("today.exploreVocabTitle"),
      desc: t("today.exploreVocabDesc"),
      action: t("suggest.newWords.action"),
      tone: "text-fn-vocab",
    },
    {
      to: "/student/dictation",
      icon: "headphones",
      iconShell: "bg-fn-dictation-soft text-fn-dictation",
      accent: "hover:border-fn-dictation/50",
      title: t("today.exploreDictationTitle"),
      desc: t("today.exploreDictationDesc"),
      action: t("suggest.lesson.action"),
      tone: "text-fn-dictation",
    },
    {
      to: "/student/shadowing",
      icon: "mic",
      iconShell: "bg-fn-shadowing-soft text-fn-shadowing",
      accent: "hover:border-fn-shadowing/50",
      title: t("today.exploreShadowingTitle"),
      desc: t("today.exploreShadowingDesc"),
      action: t("suggest.shadowing.action"),
      tone: "text-fn-shadowing",
    },
    {
      to: "/watch",
      icon: "monitor-play",
      iconShell: "bg-fn-watch-soft text-fn-watch",
      accent: "hover:border-fn-watch/50",
      title: t("today.exploreWatchTitle"),
      desc: t("today.exploreWatchDesc"),
      action: t("today.exploreWatchAction"),
      tone: "text-fn-watch",
    },
  ];

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <Icon name="compass" fallback="sparkles" className="size-4 text-primary-text" />
        <h3 className="font-display text-base font-bold">{t("today.exploreTitle")}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`group flex flex-col justify-between gap-2.5 rounded-lg border border-border bg-surface-hover/50 p-3.5 transition duration-200 hover:-translate-y-0.5 hover:bg-surface-hover ${item.accent}`}
          >
            <div className="flex items-start gap-3">
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${item.iconShell}`}>
                <Icon name={item.icon} className="text-lg" />
              </span>
              <div className="min-w-0">
                <b className="block font-display text-[15px] leading-snug">{item.title}</b>
                <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-text-muted">{item.desc}</span>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${item.tone}`}>
              {item.action}
              <Icon name="arrow-right" className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Thẻ "Tiếp tục nơi bạn đang dừng": hiển thị bài học gần nhất đang làm dở kèm thanh tiến độ và nút Tiếp tục ngay. */
function ContinueLessonCard() {
  const { t } = useTranslation("review");
  const query = useLessonSearch({ state: "doing", page: 0, size: 1 });
  const lesson = query.data?.items[0];
  if (!lesson) return null;

  const { dictationPercent, shadowingPercent } = lesson.progress;
  // Chọn chế độ đang dở và đã đi xa hơn (gần xong hơn); không có chế độ nào dở thì chọn chế độ chưa xong.
  const partial = (p: number) => p > 0 && p < 100;
  const activeMode: "dictation" | "shadowing" =
    partial(dictationPercent) && partial(shadowingPercent)
      ? dictationPercent >= shadowingPercent
        ? "dictation"
        : "shadowing"
      : partial(dictationPercent)
        ? "dictation"
        : partial(shadowingPercent)
          ? "shadowing"
          : dictationPercent < 100
            ? "dictation"
            : "shadowing";
  const percent = Math.round(activeMode === "dictation" ? dictationPercent : shadowingPercent);
  const total = lesson.sentenceCount || 0;
  const current = Math.round((total * percent) / 100);
  const thumb = lesson.thumbnailUrl ?? `https://i.ytimg.com/vi/${lesson.youtubeId}/mqdefault.jpg`;
  const totalDoing = query.data?.totalElements ?? 1;

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-border-strong">
      <Link
        to={`/student/${activeMode}/${lesson.id}`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-bg-elevated sm:w-40"
      >
        <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
      </Link>

      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-text">
            {t("today.continueOverline")}
          </span>
          <Badge variant={lesson.cefrLevel}>{lesson.cefrLevel}</Badge>
          <Badge tone={activeMode === "dictation" ? "info" : "accent"}>{t(`mode.${activeMode}`)}</Badge>
        </div>
        <Link to={`/student/${activeMode}/${lesson.id}`} className="truncate font-display text-lg font-bold hover:text-primary-text">
          {lesson.title}
        </Link>
        <div className="flex items-center gap-3">
          <ProgressBar
            value={percent}
            tone={activeMode}
            thin
            label={t("today.continueProgress", { current, total, percent })}
            className="max-w-xs"
          />
          <span className="shrink-0 text-xs font-medium tabular-nums text-text-muted">
            {t("today.continueProgress", { current, total, percent })}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link to={`/student/${activeMode}/${lesson.id}`} className={buttonClasses({ variant: "primary", size: "md" })}>
          <Icon name="play" fill />
          {t("today.continueAction")}
        </Link>
        {totalDoing > 1 && (
          <Link to="/student/lessons?state=doing" className={buttonClasses({ variant: "ghost", size: "md" })}>
            {t("today.continueAll", { count: totalDoing })}
          </Link>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ plan, streak }: { plan: DailyPlan; streak?: Streak }) {
  const { t, i18n } = useTranslation("review");
  const hasWork = plan.cardsInPlan > 0 || plan.sentences.length > 0;
  const suggestions = hasSuggestions(plan.suggestions) ? plan.suggestions : null;
  // Đã đủ định mức nhưng vẫn còn việc đến hạn: ghi rõ phần còn lại là tùy chọn.
  const backlog = plan.cardsMore > 0 || plan.sentencesPending > 0;
  const next = plan.nextCardDueAt
    ? t("empty.nextDue", {
        time: new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.nextCardDueAt)),
      })
    : t("empty.nextNone");

  const totalTarget = plan.cardsTarget + plan.sentencesTarget;
  const totalDone = Math.min(plan.cardsDoneToday, plan.cardsTarget) + Math.min(plan.sentencesDoneToday, plan.sentencesTarget);
  const overallPct = totalTarget > 0 ? Math.round((totalDone * 100) / totalTarget) : undefined;
  const canQuickReviewSentences = plan.sentences.length > 0 || plan.sentencesPending > 0;

  const hour = new Date().getHours();
  const timeGreeting = hour >= 5 && hour < 12 ? t("today.loopiMorning") : hour >= 12 && hour < 18 ? t("today.loopiAfternoon") : t("today.loopiEvening");
  const remainingCount = plan.cardsInPlan + plan.sentences.length;
  const loopiMessage = !hasWork
    ? streak && streak.current > 0
      ? t("today.loopiDoneWithStreak", { count: streak.current })
      : t("today.loopiDone")
    : remainingCount > 0 && remainingCount <= 5
      ? t("today.loopiAlmostDone", { count: remainingCount })
      : streak && streak.current > 0
        ? t("today.loopiKeepStreak", { greeting: timeGreeting, count: streak.current })
        : t("today.loopiStartStreak", { greeting: timeGreeting });

  return (
    <div
      className={`flex flex-col gap-5 rounded-lg border-2 p-6 shadow-[var(--shadow-card)] transition-colors ${
        hasWork
          ? "border-primary bg-surface"
          : "border-success/50 bg-[radial-gradient(80%_70%_at_0%_0%,color-mix(in_srgb,var(--success)_10%,transparent),transparent)] bg-surface"
      }`}
    >
      <div className="flex items-start gap-4">
        <Mascot mood={hasWork ? "hello" : "celebrate"} size={88} alt="" className="hidden sm:block" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-2xl font-bold">{hasWork ? t("today.reviewTitle") : t("today.doneTitle")}</h2>
            {!hasWork && (
              <Badge tone="success">
                <Icon name="circle-check" />
                {t("today.completedBadge")}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-text-muted">
            {hasWork
              ? t("today.reviewDesc", { cards: plan.cardsInPlan, sentences: plan.sentences.length })
              : `${backlog ? t("today.doneQuota", { cards: plan.cardsDue, sentences: plan.sentencesPending }) : t("today.doneDesc")} ${next}`}
          </p>
          <p className="mt-2.5 inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary-soft/50 px-3 py-1.5 text-[13px] font-medium text-text">
            <Icon name="sparkles" className="size-3.5 shrink-0 text-primary-text" />
            <span>{loopiMessage}</span>
          </p>
          {hasWork && (
            <div className="mt-2.5">
              <CardSourceChips sources={plan.cardSources} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuotaStat
          icon="layers"
          done={plan.cardsDoneToday}
          target={plan.cardsTarget}
          doneLabel={t("today.cardsDone")}
          idleLabel={t("today.cardsDue")}
          tone="vocab"
        />
        <QuotaStat
          icon="mic"
          done={plan.sentencesDoneToday}
          target={plan.sentencesTarget}
          doneLabel={t("today.sentencesDone")}
          idleLabel={t("today.sentencesPending")}
          tone="shadowing"
          actionTo={canQuickReviewSentences ? "/student/review/sentences" : undefined}
          actionLabel={canQuickReviewSentences ? t("today.sentencesQuick") : undefined}
        />
        {/* Giá trị và thanh tiến độ cùng một đại lượng (phần trăm định mức); số phút mục tiêu chỉ là ghi chú phụ. */}
        {overallPct !== undefined ? (
          <Stat
            icon="target"
            value={`${overallPct}%`}
            label={t("today.goalProgress", { percent: overallPct })}
            tone={overallPct === 100 ? "success" : "primary"}
            progress={overallPct}
            subLabel={t("today.goalPlan", { minutes: plan.dailyMinutes })}
          />
        ) : (
          <Stat icon="target" value={t("today.minutes", { count: plan.dailyMinutes })} label={t("today.goal")} />
        )}
      </div>

      {hasWork ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/student/review/daily" className={buttonClasses({ variant: "primary", size: "lg" })}>
              <Icon name="play" fill />
              {t("today.start")}
            </Link>
            <Link to="/student/lessons" className={buttonClasses({ variant: "ghost", size: "lg" })}>
              {t("empty.practiceLessons")}
            </Link>
          </div>
          {suggestions ? <SuggestionCards suggestions={suggestions} dailyMinutes={plan.dailyMinutes} /> : <QuickExploreCards />}
        </div>
      ) : suggestions ? (
        <SuggestionCards suggestions={suggestions} dailyMinutes={plan.dailyMinutes} />
      ) : (
        <QuickExploreCards />
      )}

      {/* Đã đủ định mức mà vẫn còn thẻ đến hạn: ôn thêm là tùy chọn, ở cả hai nhánh gợi ý (BR-HT-24). */}
      {!hasWork && plan.cardsMore > 0 && (
        <div>
          <Link to="/student/review/daily?more=1" className={buttonClasses({ variant: "ghost" })}>
            <Icon name="layers" />
            {t("today.more", { count: plan.cardsMore })}
          </Link>
        </div>
      )}
    </div>
  );
}

function HeroStreakPill({ streak }: { streak: Streak }) {
  const { t } = useTranslation("review");
  const active = streak.studiedToday;
  const hasStreak = streak.current > 0;
  const statusText = active ? t("today.streakDone") : hasStreak ? t("today.streakKeep") : t("today.streakStart");

  return (
    <a
      href="#v-stats"
      className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-success/40 bg-success/10 text-success hover:border-success/60"
          : hasStreak
            ? "border-warning/40 bg-warning/10 text-warning hover:border-warning/60"
            : "border-border bg-surface text-text-muted hover:border-border-strong"
      }`}
    >
      <Icon name="flame" fill={active || hasStreak} className="size-4" />
      <span className="font-display text-sm font-bold tabular-nums">{t("today.streakDays", { count: streak.current })}</span>
      <span aria-hidden="true" className="opacity-50">
        ·
      </span>
      <span>{statusText}</span>
    </a>
  );
}

/**
 * Trang "Hôm nay" (đích sau onboarding): mục tiêu ngày, việc cần ôn và nút bắt đầu Ôn tập hôm nay (UC-HT-05), kèm khu
 * vực Thống kê học tập ở bên dưới (UC-TH-01, UC-TH-02).
 */
export default function TodayPage() {
  const { t, i18n } = useTranslation("review");
  const name = useAuthStore((state) => state.user?.displayName);
  const query = useDailyPlan(0);
  const streakQuery = useStreak();

  const todayFormatted = new Intl.DateTimeFormat(i18n.language, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <section className="flex w-full flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-text">
              <Icon name="sun" className="size-3.5" />
              {t("today.overline")}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted">{todayFormatted}</span>
          </div>
          <h1 className="mt-1 font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">
            {name ? t("today.greeting", { name }) : t("today.greetingAnon")}
          </h1>
        </div>
        {streakQuery.data && <HeroStreakPill streak={streakQuery.data} />}
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
      {query.isSuccess && <ReviewCard plan={query.data} streak={streakQuery.data} />}

      <ContinueLessonCard />

      <StatsDashboard />
    </section>
  );
}
