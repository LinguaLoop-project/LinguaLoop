import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import ErrorState from "@/components/common/ErrorState";
import Skeleton from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { buttonClasses } from "@/components/common/buttonStyles";
import ReviewShell from "../components/ReviewShell";
import ReviewSummary from "../components/ReviewSummary";
import SentenceReviewFlow from "../components/SentenceReviewFlow";
import { useSentencePlan } from "../hooks";
import type { PlanSentence, SentenceOutcome } from "../types";

/** Số câu tối đa mỗi chế độ trong một nhóm của Ôn câu riêng (BR-HT-20). */
const PER_MODE = 2;

function Session({ sentences, onMore }: { sentences: PlanSentence[]; onMore: () => void }) {
  const { t } = useTranslation("review");
  const [outcomes, setOutcomes] = useState<SentenceOutcome[]>([]);
  const [exited, setExited] = useState(false);
  const finished = exited || outcomes.length >= sentences.length;

  if (finished) {
    return <ReviewSummary cards={null} sentences={outcomes} exited={exited} onMoreSentences={onMore} />;
  }

  return (
    <ReviewShell
      title={t("sentences.title")}
      steps={[{ key: "sentences", state: "active", label: t("steps.sentencesAt", { current: outcomes.length + 1, total: sentences.length }) }]}
      scrollKey={outcomes.length}
      percent={(outcomes.length / sentences.length) * 100}
      progressLabel={t("steps.sentences")}
      onExit={() => setExited(true)}
    >
      <SentenceReviewFlow sentences={sentences} index={outcomes.length} onFinished={(outcome) => setOutcomes((prev) => [...prev, outcome])} />
    </ReviewShell>
  );
}

/** Ôn câu riêng (UC-HT-04): mỗi nhóm tối đa 2 câu ở từng chế độ, "Ôn thêm" lấy nhóm kế tiếp cho tới khi hết câu. */
export default function SentenceReviewPage() {
  const { t } = useTranslation("review");
  const [run, setRun] = useState(0);
  const query = useSentencePlan(PER_MODE, run);

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

  if (query.data.length === 0) {
    return (
      <EmptyState title={run > 0 ? t("sentences.allDoneTitle") : t("sentences.emptyTitle")} description={t("sentences.emptyDesc")}>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/student/mywords" className={buttonClasses({ variant: "primary" })}>
            {t("sentences.backToList")}
          </Link>
          <Link to="/student/lessons" className={buttonClasses({ variant: "ghost" })}>
            {t("empty.practiceLessons")}
          </Link>
        </div>
      </EmptyState>
    );
  }

  return <Session key={run} sentences={query.data} onMore={() => setRun((value) => value + 1)} />;
}
