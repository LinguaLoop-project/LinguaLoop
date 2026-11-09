import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import ErrorState from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { vocabApi } from "../../api";
import { useReviewQueue } from "../../hooks";
import { useAnswerSubmit } from "../../useAnswerSubmit";
import type { ReviewQueue } from "../../types";
import ReviewSession from "./ReviewSession";

function Loading() {
  const { t } = useTranslation("vocab");
  return (
    <div role="status" aria-label={t("review.loading")} className="flex flex-col gap-4">
      <Skeleton className="h-[72px] rounded-lg" />
      <Skeleton className="h-[320px] rounded-lg" />
    </div>
  );
}

/** Không còn thẻ nào đến hạn: báo đã ôn xong, khi nào có thẻ tiếp theo và gợi ý học tiếp (UC-HT-03, luồng 2a). */
function NothingDue({ queue }: { queue: ReviewQueue }) {
  const { t, i18n } = useTranslation("vocab");
  const next = queue.nextDueAt
    ? t("review.nextDue", {
        time: new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(queue.nextDueAt)),
      })
    : t("review.nextNone");
  return (
    <EmptyState title={t("review.emptyTitle")} description={`${t("review.emptyDesc")} ${next}`}>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to="/student/vocab" className={buttonClasses({ variant: "primary" })}>
          <Icon name="layers" className="h-4 w-4" />
          {t("review.learnNew")}
        </Link>
        <Link to="/student/lessons" className={buttonClasses({ variant: "ghost" })}>
          {t("review.practiceLessons")}
        </Link>
      </div>
    </EmptyState>
  );
}

/**
 * Tab "Ôn thẻ" của trang Từ vựng (UC-HT-03): lấy tối đa 50 thẻ đến hạn của mọi bộ (hoặc một bộ khi có `deck`), mở một phiên
 * ôn mới cho mỗi lượt (BR-HT-15) và cho học viên lật thẻ rồi tự chấm. "Ôn tiếp" tải lượt kế tiếp.
 */
export default function ReviewPanel({ deck }: { deck: string | undefined }) {
  const { t } = useTranslation("vocab");
  const [run, setRun] = useState(0);
  const query = useReviewQueue(deck, run);

  // Mở phiên ôn khi có thẻ để ôn; dùng truy vấn để StrictMode không mở hai phiên.
  const session = useQuery({
    queryKey: ["vocab", "review-session", deck ?? "", run],
    queryFn: () => vocabApi.openReviewSession(deck),
    enabled: query.isSuccess && query.data.cards.length > 0,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const submit = useAnswerSubmit(session.data ?? null);

  if (query.isPending) return <Loading />;
  if (query.isError) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined;
    return status === 404 ? (
      <ErrorState
        kind="notFound"
        action={<Link to="/student/vocab" className={buttonClasses({ variant: "ghost" })}>{t("review.backToDecks")}</Link>}
      />
    ) : (
      <ErrorState
        kind={isAxiosError(query.error) && !query.error.response ? "network" : "server"}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  const queue = query.data;
  if (queue.cards.length === 0) return <NothingDue queue={queue} />;

  return (
    <ReviewSession
      key={run}
      queue={queue}
      onAnswer={submit}
      onContinue={() => setRun((value) => value + 1)}
    />
  );
}
