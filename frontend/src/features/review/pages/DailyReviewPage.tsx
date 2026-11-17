import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import Skeleton from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { buttonClasses } from "@/components/common/buttonStyles";
import { preloadYouTubeApi } from "@/features/dictation/usePlayer";
import type { RoundSummary } from "@/features/vocab/components/review/ReviewSession";
import DailyCards from "../components/DailyCards";
import ReviewShell, { type ShellStep } from "../components/ReviewShell";
import ReviewSummary from "../components/ReviewSummary";
import SuggestionCards from "../components/SuggestionCards";
import SentenceReviewFlow from "../components/SentenceReviewFlow";
import { phaseAfterCards, startPhase, stepStates, type DailyPhase } from "../flow";
import { useDailyPlan, useRemainingPlan } from "../hooks";
import type { DailyPlan, SentenceOutcome } from "../types";

/** Thời gian hiện dòng "Xong phần thẻ, sang ôn câu" trước khi vào câu đầu tiên. */
const BRIDGE_MS = 1100;

function NothingToReview({ plan }: { plan: DailyPlan }) {
  const { t, i18n } = useTranslation("review");
  const next = plan.nextCardDueAt
    ? t("empty.nextDue", {
        time: new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.nextCardDueAt)),
      })
    : t("empty.nextNone");
  return (
    <EmptyState title={t("empty.title")} description={`${t("empty.desc")} ${next}`}>
      {plan.suggestions && (plan.suggestions.newWords || plan.suggestions.dictationLesson) ? (
        <div className="mt-4 w-full max-w-xl text-left">
          <SuggestionCards suggestions={plan.suggestions} dailyMinutes={plan.dailyMinutes} />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/student/vocab" className={buttonClasses({ variant: "primary" })}>
            <Icon name="layers" className="h-4 w-4" />
            {t("empty.learnNew")}
          </Link>
          <Link to="/student/lessons" className={buttonClasses({ variant: "ghost" })}>
            {t("empty.practiceLessons")}
          </Link>
        </div>
      )}
    </EmptyState>
  );
}

interface SessionProps {
  plan: DailyPlan;
  run: number;
  /** Lượt "Ôn tiếp": chỉ thẻ, không lấy thêm câu (BR-HT-24). */
  extra: boolean;
  onContinue: () => void;
}

/** Một lượt của phiên Ôn tập hằng ngày: thẻ rồi câu, chuyển liền mạch, kết thúc bằng tổng kết chung (UC-HT-05). */
function DailySession({ plan, run, extra, onContinue }: SessionProps) {
  const { t } = useTranslation("review");
  const sentences = extra ? [] : plan.sentences;
  const hasCards = plan.cardsInPlan > 0;
  const initial = startPhase(plan, extra);

  const [phase, setPhase] = useState<DailyPhase>(initial === "empty" ? "summary" : initial);
  const [cards, setCards] = useState<RoundSummary | null>(null);
  const [outcomes, setOutcomes] = useState<SentenceOutcome[]>([]);
  const [exited, setExited] = useState(false);

  // Trong lúc làm thẻ, nạp sẵn trình phát YouTube để câu đầu mở nhanh.
  useEffect(() => {
    if (phase === "cards" && sentences.length > 0) preloadYouTubeApi();
  }, [phase, sentences.length]);

  // Đoạn chuyển ngắn từ thẻ sang câu, không cần bấm thêm gì.
  useEffect(() => {
    if (phase !== "bridge") return;
    const id = window.setTimeout(() => setPhase("sentences"), BRIDGE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const completeCards = useCallback(
    (score: RoundSummary) => {
      setCards(score);
      setPhase(phaseAfterCards(plan, extra));
    },
    [plan, extra],
  );

  const exitCards = useCallback((score: RoundSummary) => {
    setCards(score);
    setExited(true);
    setPhase("summary");
  }, []);

  const remaining = useRemainingPlan(run, phase === "summary");

  if (phase === "summary") {
    return (
      <ReviewSummary
        cards={hasCards ? (cards ?? { right: 0, redone: 0, total: 0 }) : null}
        sentences={outcomes}
        exited={exited}
        moreCards={remaining.data?.cardsDue ?? 0}
        onContinueCards={onContinue}
      />
    );
  }

  const steps: ShellStep[] = [];
  const states = stepStates(phase, hasCards, sentences.length > 0);
  if (states.cards) steps.push({ key: "cards", state: states.cards, label: t("steps.cards") });
  if (states.sentences) {
    const label = phase === "sentences" ? t("steps.sentencesAt", { current: outcomes.length + 1, total: sentences.length }) : t("steps.sentences");
    steps.push({ key: "sentences", state: states.sentences, label });
  }

  const inSentences = phase === "sentences";
  return (
    <ReviewShell
      title={extra ? t("daily.titleMore") : t("daily.title")}
      steps={steps}
      scrollKey={`${phase}-${outcomes.length}`}
      percent={inSentences ? (outcomes.length / sentences.length) * 100 : undefined}
      progressLabel={t("steps.sentences")}
      onExit={
        inSentences
          ? () => {
              setExited(true);
              setPhase("summary");
            }
          : undefined
      }
    >
      {phase === "cards" && <DailyCards limit={plan.cardQuota} run={run} onComplete={completeCards} onExit={exitCards} />}
      {phase === "bridge" && (
        <div role="status" className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface px-6 py-14 text-center shadow-[var(--shadow-card)]">
          <Mascot mood="celebrate" size={96} alt="" />
          <p className="font-display text-xl font-bold">{t("bridge.title")}</p>
          <p className="text-sm text-text-muted">{t("bridge.desc", { count: sentences.length })}</p>
        </div>
      )}
      {inSentences && (
        <SentenceReviewFlow
          sentences={sentences}
          index={outcomes.length}
          onFinished={(outcome) => {
            const next = [...outcomes, outcome];
            setOutcomes(next);
            if (next.length >= sentences.length) setPhase("summary");
          }}
        />
      )}
    </ReviewShell>
  );
}

/** Ôn tập hằng ngày (UC-HT-05): lập kế hoạch theo mục tiêu ngày rồi dẫn học viên qua thẻ và câu. */
export default function DailyReviewPage() {
  const { t } = useTranslation("review");
  const [run, setRun] = useState(0);
  const query = useDailyPlan(run);

  if (query.isPending) {
    return (
      <div role="status" aria-label={t("loading")} className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Skeleton className="h-[72px] rounded-lg" />
        <Skeleton className="h-[320px] rounded-lg" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState
        kind={isAxiosError(query.error) && !query.error.response ? "network" : "server"}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  const plan = query.data;
  const extra = run > 0;
  if (startPhase(plan, extra) === "empty") return <NothingToReview plan={plan} />;

  return <DailySession key={run} plan={plan} run={run} extra={extra} onContinue={() => setRun((value) => value + 1)} />;
}
