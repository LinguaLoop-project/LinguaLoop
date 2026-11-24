import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { vocabApi } from "@/features/vocab/api";
import ReviewSession, { type RoundSummary } from "@/features/vocab/components/review/ReviewSession";
import { useAnswerSubmit } from "@/features/vocab/useAnswerSubmit";
import type { AnswerDraft, LearnCard, ReviewQueue } from "@/features/vocab/types";
import { useDailyCards } from "../hooks";
import type { DailyCardSource } from "../types";

export interface DailyCardsProps {
  /** Lượt "Ôn thêm": chỉ thẻ đến hạn, không tính định mức (BR-HT-24). */
  extra: boolean;
  /** Tăng mỗi lần "Ôn tiếp" để mở lượt và phiên mới. */
  run: number;
  onComplete: (score: RoundSummary) => void;
  onExit: (score: RoundSummary) => void;
}

/**
 * Chặng ôn thẻ của phiên Ôn tập hằng ngày (UC-HT-05): lấy các thẻ của khung bài ngày (đến hạn, từ mới, thẻ củng cố,
 * BR-HT-29), mở một phiên ôn mới (BR-HT-15) và chạy `ReviewSession` ở chế độ nhúng, không có màn kết thúc riêng để chuyển
 * thẳng sang phần câu. Thẻ củng cố chỉ luyện: câu trả lời gửi kèm `practice` để không đổi lịch ôn (BR-HT-30).
 */
export default function DailyCards({ extra, run, onComplete, onExit }: DailyCardsProps) {
  const { t } = useTranslation("review");
  const query = useDailyCards(run, extra);

  const sources = useMemo(() => {
    const map = new Map<string, DailyCardSource>();
    for (const item of query.data?.cards ?? []) map.set(item.card.id, item.source);
    return map;
  }, [query.data]);

  // Thẻ củng cố không có khoảng ôn kế tiếp để báo trước vì lịch của chúng không đổi.
  const queue = useMemo<ReviewQueue | null>(() => {
    if (!query.data) return null;
    const cards = query.data.cards.map(({ card, source }) => (source === "REINFORCE" ? { ...card, previews: [] } : card));
    return { deck: null, cards, dueTotal: cards.length, nextDueAt: null };
  }, [query.data]);

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
  const answer = (draft: AnswerDraft) => submit(sources.get(draft.cardId) === "REINFORCE" ? { ...draft, practice: true } : draft);

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

  const note = (card: LearnCard) => {
    const source = sources.get(card.id);
    if (source === "NEW_WORD") {
      return (
        <p className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <Badge variant="info">
            <Icon name="sparkles" />
            {t("source.newWord")}
          </Badge>
          {t("source.newWordHint")}
        </p>
      );
    }
    if (source === "REINFORCE") {
      return (
        <p className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <Badge variant="warning">
            <Icon name="refresh-cw" />
            {t("source.reinforceTag")}
          </Badge>
          {t("source.reinforceHint")}
        </p>
      );
    }
    return null;
  };

  return <ReviewSession key={run} queue={queue ?? { deck: null, cards: [], dueTotal: 0, nextDueAt: null }} onAnswer={answer} onContinue={() => undefined} embedded={{ onComplete, onExit }} renderNote={note} />;
}
