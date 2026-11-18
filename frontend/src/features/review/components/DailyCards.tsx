import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import ErrorState from "@/components/common/ErrorState";
import Skeleton from "@/components/common/Skeleton";
import { vocabApi } from "@/features/vocab/api";
import ReviewSession, { type RoundSummary } from "@/features/vocab/components/review/ReviewSession";
import { useReviewQueue } from "@/features/vocab/hooks";
import { useAnswerSubmit } from "@/features/vocab/useAnswerSubmit";

export interface DailyCardsProps {
  /** Số thẻ tối đa của phiên theo mục tiêu ngày (BR-HT-24). */
  limit: number;
  /** Tăng mỗi lần "Ôn tiếp" để mở lượt và phiên mới. */
  run: number;
  onComplete: (score: RoundSummary) => void;
  onExit: (score: RoundSummary) => void;
}

/**
 * Chặng ôn thẻ của phiên Ôn tập hằng ngày (UC-HT-05): lấy tối đa `limit` thẻ đến hạn, mở một phiên ôn mới (BR-HT-15) và
 * chạy `ReviewSession` ở chế độ nhúng, không có màn kết thúc riêng để chuyển thẳng sang phần câu.
 */
export default function DailyCards({ limit, run, onComplete, onExit }: DailyCardsProps) {
  const query = useReviewQueue(undefined, run, limit);

  const session = useQuery({
    queryKey: ["vocab", "review-session", "daily", run],
    queryFn: () => vocabApi.openReviewSession(undefined),
    enabled: query.isSuccess && query.data.cards.length > 0,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const submit = useAnswerSubmit(session.data ?? null);

  const empty = query.isSuccess && query.data.cards.length === 0;
  // Kế hoạch báo có thẻ nhưng lúc lấy đã hết (đổi ngày, ôn ở thiết bị khác): coi như xong phần thẻ.
  useEffect(() => {
    if (empty) onComplete({ right: 0, redone: 0, total: 0 });
  }, [empty, onComplete]);

  if (query.isPending || empty) return <Skeleton className="h-[320px] rounded-lg" />;
  if (query.isError) {
    return (
      <ErrorState
        kind={isAxiosError(query.error) && !query.error.response ? "network" : "server"}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  return <ReviewSession key={run} queue={query.data} onAnswer={submit} onContinue={() => undefined} embedded={{ onComplete, onExit }} />;
}
