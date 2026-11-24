import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { toast } from "@/stores/toastStore";
import FullInput from "@/features/dictation/components/FullInput";
import ResultDiff from "@/features/dictation/components/ResultDiff";
import { useDictationPrompt, useRevealWord, useSubmitAttempt } from "@/features/dictation/hooks";
import type { AttemptResult, RevealedWords, SubmitAttemptBody } from "@/features/dictation/types";
import { isNetworkError, MAX_DURATION_MS, mergeRevealed, resultContext } from "@/features/dictation/utils";
import { WordSourceProvider } from "@/features/dictionary";
import ReviewPromptDialog from "@/features/practice/components/ReviewPromptDialog";
import { useSetReview } from "@/features/practice/hooks";
import { reviewPromptKind, type ReviewPrompt } from "@/features/practice/reviewPrompt";
import { useMarkReviewed } from "../hooks";
import type { StepProps } from "./stepTypes";

/**
 * Một câu Nghe chép trong phiên ôn câu (UC-HT-04). Làm ở mức Normal (gõ cả câu, có ô theo độ dài từng từ) và luôn là lượt
 * làm lại: hiện trong lịch sử nhưng không vào thống kê điểm yếu (BR-HT-23). Lượt lưu thành công thì câu được đánh dấu
 * "đã ôn hôm nay" (BR-HT-21); bấm "Hiện cả câu" thì không.
 */
export default function DictationReviewStep({ sentence, player, onFinished }: StepProps) {
  const { t } = useTranslation("review");
  const prompt = useDictationPrompt(sentence.sentenceId, "normal", true);
  const slots = useMemo(
    () => prompt.data?.tokens.flatMap((token) => (token.length == null ? [] : [{ position: token.position, length: token.length }])) ?? null,
    [prompt.data],
  );

  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState<RevealedWords>({});
  const [replays, setReplays] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [reviewPrompt, setReviewPrompt] = useState<ReviewPrompt | null>(null);
  const [startedAt] = useState(() => Date.now());

  const revealWord = useRevealWord();
  const submitAttempt = useSubmitAttempt(sentence.lessonId);
  const markReviewed = useMarkReviewed();
  const setReview = useSetReview("dictation");
  const canPlay = player.status === "ready" || player.status === "blocked";

  const listen = () => {
    if (!canPlay) return;
    setReplays((n) => n + 1);
    player.playSentence(sentence.startMs, sentence.endMs);
  };

  const onAttemptDone = (attempt: AttemptResult) => {
    player.stop();
    setResult(attempt);
    if (attempt.gaveUp) return;
    markReviewed.mutate({ mode: "dictation", sentenceId: sentence.sentenceId });
    const kind = reviewPromptKind(attempt.score, true);
    if (kind) setReviewPrompt({ kind, sentenceId: sentence.sentenceId, mode: "dictation", score: attempt.score });
  };

  const send = (extra: Partial<SubmitAttemptBody>) => {
    submitAttempt.mutate(
      {
        sentenceId: sentence.sentenceId,
        body: {
          level: "normal",
          playbackRate: 1,
          replayCount: replays,
          durationMs: Math.min(Date.now() - startedAt, MAX_DURATION_MS),
          retry: true,
          clientRequestId: crypto.randomUUID(),
          ...extra,
        },
      },
      { onSuccess: onAttemptDone },
    );
  };

  const revealAt = (position: number) => {
    if (revealWord.isPending) return;
    revealWord.mutate(
      { sentenceId: sentence.sentenceId, body: { position } },
      {
        onSuccess: ({ position: revealedPosition, word }) => {
          if (revealedPosition !== null && word !== null) setRevealed((prev) => ({ ...prev, [revealedPosition]: word }));
        },
        onError: (error) => toast(isNetworkError(error) ? t("errors.network") : t("errors.generic"), { icon: "circle-alert" }),
      },
    );
  };

  const submit = () => {
    if (submitAttempt.isPending) return;
    const typedText = slots ? mergeRevealed(typed, slots.map((slot) => slot.position), revealed) : typed;
    if (!typedText.trim()) {
      toast(t("dictation.empty"), { icon: "keyboard" });
      return;
    }
    send({ typedText, revealedPositions: Object.keys(revealed).map(Number) });
  };

  const giveUp = () => {
    if (!submitAttempt.isPending) send({ gaveUp: true });
  };

  const finish = () =>
    onFinished(result && !result.gaveUp ? { score: result.score, skipped: false } : { score: null, skipped: true });

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <WordSourceProvider sentenceId={sentence.sentenceId}>
          <ResultDiff
            score={result.score}
            level={result.level}
            words={result.words}
            context={resultContext(result)}
            gaveUp={result.gaveUp}
            detailLoading={false}
            text={result.text}
            textVi={result.textVi}
            showTranslation
          />
        </WordSourceProvider>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="ghost" size="sm" leftIcon={<Icon name="volume-2" />} disabled={!canPlay} onClick={listen}>
            {t("dictation.listenAgain")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="rotate-ccw" />}
            onClick={() => {
              setResult(null);
              setTyped("");
              setRevealed({});
              setReplays(0);
            }}
          >
            {t("retry")}
          </Button>
          <span className="grow" />
          <Button rightIcon={<Icon name="arrow-right" />} onClick={finish}>
            {t("next")}
          </Button>
        </div>
        <ReviewPromptDialog prompt={reviewPrompt} setReview={setReview} onClose={() => setReviewPrompt(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-muted">{t("dictation.hint")}</p>
        <Button variant="ghost" leftIcon={<Icon name="volume-2" />} disabled={!canPlay} onClick={listen}>
          {t("dictation.listen")}
        </Button>
      </div>

      {submitAttempt.isError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-dashed border-warning bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-3.5 py-3 text-sm">
          <span>{isNetworkError(submitAttempt.error) ? t("errors.network") : t("errors.submit")}</span>
          {submitAttempt.variables && (
            <Button variant="text" size="sm" onClick={() => submitAttempt.mutate(submitAttempt.variables, { onSuccess: onAttemptDone })}>
              {t("retry")}
            </Button>
          )}
        </div>
      )}

      {prompt.isPending ? (
        <Skeleton className="h-[140px] rounded-lg" />
      ) : (
        <FullInput
          value={typed}
          onChange={setTyped}
          onSubmit={submit}
          onGiveUp={giveUp}
          submitting={submitAttempt.isPending}
          slots={slots}
          revealed={revealed}
          revealing={revealWord.isPending}
          onReveal={revealAt}
          onHint={() => undefined}
          hint={null}
          hintLengths={null}
        />
      )}

      <div className="flex justify-end">
        <Button variant="text" size="sm" onClick={() => onFinished({ score: null, skipped: true })}>
          {t("skip")}
        </Button>
      </div>
    </div>
  );
}
