import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import ErrorState from "@/components/common/ErrorState";
import Skeleton from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { buttonClasses } from "@/components/common/buttonStyles";
import type { PracticeMode } from "@/features/practice/types";
import ReviewShell from "../components/ReviewShell";
import ReviewSummary from "../components/ReviewSummary";
import SentenceReviewFlow from "../components/SentenceReviewFlow";
import { useSentencePlan } from "../hooks";
import type { PlanSentence, SentenceOutcome } from "../types";

/** Số câu tối đa mỗi chế độ trong một nhóm của Ôn câu riêng (BR-HT-20). */
const PER_MODE = 2;
const BACK_TO_LIST = "/student/mywords?tab=review";

function Session({
  sentences,
  isSingle,
  onMore,
  onRetrySingle,
}: {
  sentences: PlanSentence[];
  isSingle: boolean;
  onMore: () => void;
  onRetrySingle?: () => void;
}) {
  const { t } = useTranslation("review");
  const navigate = useNavigate();
  const [outcomes, setOutcomes] = useState<SentenceOutcome[]>([]);
  const [exited, setExited] = useState(false);
  const finished = exited || outcomes.length >= sentences.length;

  const handleExit = () => {
    // Nếu chưa làm xong câu nào (hoặc đang ôn lẻ 1 câu mà bấm Thoát) thì quay thẳng về danh sách Câu cần ôn
    if (outcomes.length === 0) {
      navigate(BACK_TO_LIST);
      return;
    }
    setExited(true);
  };

  if (finished) {
    return (
      <ReviewSummary
        cards={null}
        sentences={outcomes}
        exited={exited}
        backTo={BACK_TO_LIST}
        backLabel={t("sentences.backToList")}
        onRetrySentence={isSingle ? onRetrySingle : undefined}
        onMoreSentences={onMore}
      />
    );
  }

  return (
    <ReviewShell
      title={t("sentences.title")}
      backTo={BACK_TO_LIST}
      backLabel={t("sentences.backToList")}
      steps={[{ key: "sentences", state: "active", label: t("steps.sentencesAt", { current: outcomes.length + 1, total: sentences.length }) }]}
      scrollKey={outcomes.length}
      percent={(outcomes.length / sentences.length) * 100}
      progressLabel={t("steps.sentences")}
      onExit={handleExit}
    >
      <SentenceReviewFlow sentences={sentences} index={outcomes.length} onFinished={(outcome) => setOutcomes((prev) => [...prev, outcome])} />
    </ReviewShell>
  );
}

/** Ôn câu riêng (UC-HT-04): mỗi nhóm tối đa 2 câu ở từng chế độ, hoặc ôn trực tiếp 1 câu cụ thể khi truyền `sentenceId` & `mode`. */
export default function SentenceReviewPage() {
  const { t } = useTranslation("review");
  const [searchParams, setSearchParams] = useSearchParams();
  const [run, setRun] = useState(0);
  const sentenceId = searchParams.get("sentenceId") || undefined;
  const rawMode = searchParams.get("mode");
  const mode: PracticeMode | undefined =
    rawMode === "dictation" || rawMode === "shadowing" ? rawMode : undefined;
  const isSingle = Boolean(sentenceId && mode);

  const query = useSentencePlan(PER_MODE, run, sentenceId, mode);

  const handleMore = () => {
    if (sentenceId || mode) {
      setSearchParams({}, { replace: true });
    }
    setRun((value) => value + 1);
  };

  const handleRetrySingle = () => {
    setRun((value) => value + 1);
  };

  if (query.isPending) {
    return (
      <div role="status" aria-label={t("loading")} className="flex w-full flex-col gap-4">
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
          <Link to="/student/mywords?tab=review" className={buttonClasses({ variant: "primary" })}>
            {t("sentences.backToList")}
          </Link>
          <Link to="/student/lessons" className={buttonClasses({ variant: "ghost" })}>
            {t("empty.practiceLessons")}
          </Link>
        </div>
      </EmptyState>
    );
  }

  return (
    <Session
      key={`${run}-${sentenceId ?? "all"}-${mode ?? "all"}`}
      sentences={query.data}
      isSingle={isSingle}
      onMore={handleMore}
      onRetrySingle={handleRetrySingle}
    />
  );
}
