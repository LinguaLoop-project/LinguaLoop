import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { toApiError } from "@/features/auth";
import { ClickableText, WordSourceProvider } from "@/features/dictionary";
import ReviewPromptDialog from "@/features/practice/components/ReviewPromptDialog";
import { useSetReview } from "@/features/practice/hooks";
import { reviewPromptKind, type ReviewPrompt } from "@/features/practice/reviewPrompt";
import AttemptResult from "@/features/shadowing/components/AttemptResult";
import { useWavRecorder } from "@/features/shadowing/hooks/useWavRecorder";
import { useAssessAttempt } from "@/features/shadowing/hooks/useShadowing";
import type { SentenceRecord } from "@/features/shadowing/types";
import { recordFromAttempt } from "@/features/shadowing/utils";
import { useMarkReviewed } from "../hooks";
import type { StepProps } from "./stepTypes";

type Phase = "idle" | "recording" | "scoring";

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Mã lỗi của server → khoá thông báo cho người học. */
function errorKey(error: unknown): string {
  switch (toApiError(error).code) {
    case "SHADOWING_NO_SPEECH":
      return "errors.noSpeech";
    case "SHADOWING_SCORING_BUSY":
    case "SHADOWING_SCORING_UNAVAILABLE":
      return "errors.scoringBusy";
    case "NETWORK_ERROR":
      return "errors.network";
    default:
      return "errors.generic";
  }
}

/**
 * Một câu Shadowing trong phiên ôn câu (UC-HT-04): nghe mẫu, đọc theo và nhận điểm phát âm như lượt đọc thông thường
 * (BR-HT-23). Lượt chấm xong thì câu được đánh dấu "đã ôn hôm nay" (BR-HT-21).
 */
export default function ShadowingReviewStep({ sentence, player, onFinished }: StepProps) {
  const { t } = useTranslation("review");
  const recorder = useWavRecorder();
  const { stop: stopMic, cancel: cancelMic } = recorder;
  const assess = useAssessAttempt();
  const markReviewed = useMarkReviewed();
  const setReview = useSetReview("shadowing");

  const [phase, setPhase] = useState<Phase>("idle");
  const [record, setRecord] = useState<SentenceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewPrompt, setReviewPrompt] = useState<ReviewPrompt | null>(null);
  /** Bản ghi gần nhất, để gửi lại khi lỗi mạng hoặc hệ thống chấm bận. */
  const [lastWav, setLastWav] = useState<Blob | null>(null);
  const canPlay = player.status === "ready" || player.status === "blocked";

  // Rời câu giữa lúc đang ghi thì bỏ bản ghi dở
  useEffect(() => () => cancelMic(), [cancelMic]);

  const submit = useCallback(
    (wav: Blob) => {
      setPhase("scoring");
      setError(null);
      assess.mutate(
        { sentenceId: sentence.sentenceId, wav },
        {
          onSuccess: (result) => {
            setRecord((prev) => recordFromAttempt(prev ?? undefined, result));
            setPhase("idle");
            markReviewed.mutate({ mode: "shadowing", sentenceId: sentence.sentenceId });
            // Câu luyện thêm không ở trong danh sách nên chỉ có thể được hỏi lưu, không được hỏi bỏ (BR-HT-31).
            const kind = reviewPromptKind(result.score, !sentence.extra);
            if (kind) setReviewPrompt({ kind, sentenceId: sentence.sentenceId, mode: "shadowing", score: result.score });
          },
          onError: (err) => {
            setPhase("idle");
            setError(errorKey(err));
          },
        },
      );
    },
    [assess, markReviewed, sentence.extra, sentence.sentenceId],
  );

  const stopRecording = useCallback(() => {
    const wav = stopMic();
    if (!wav) {
      setPhase("idle");
      setError("errors.tooShort");
      return;
    }
    setLastWav(wav);
    submit(wav);
  }, [stopMic, submit]);

  // Tự dừng khi quá dài: gấp đôi độ dài câu mẫu, trong khoảng 4–20 giây
  useEffect(() => {
    if (phase !== "recording") return;
    const ms = clamp(((sentence.endMs - sentence.startMs) / 1000) * 2, 4, 20) * 1000;
    const id = window.setTimeout(stopRecording, ms);
    return () => window.clearTimeout(id);
  }, [phase, sentence.endMs, sentence.startMs, stopRecording]);

  const startRecording = async () => {
    setError(null);
    player.stop();
    try {
      await recorder.start();
    } catch {
      setError("errors.mic");
      return;
    }
    setPhase("recording");
  };

  const onMicClick = () => {
    if (phase === "recording") stopRecording();
    else if (phase === "idle") void startRecording();
  };

  const listen = () => {
    if (canPlay) player.playSentence(sentence.startMs, sentence.endMs);
  };

  const recording = phase === "recording";
  const scoring = phase === "scoring";

  if (record) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3.5">
          <WordSourceProvider sentenceId={sentence.sentenceId}>
            <p className="text-[17px] font-medium leading-snug text-text">
              <ClickableText text={sentence.text} />
            </p>
          </WordSourceProvider>
          {sentence.textVi && <p className="mt-1 text-sm text-text-muted">{sentence.textVi}</p>}
        </div>
        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-dashed border-warning bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-3.5 py-3 text-sm">
            <span>{t(error)}</span>
            {lastWav && error !== "errors.mic" && error !== "errors.tooShort" && (
              <Button variant="text" size="sm" onClick={() => submit(lastWav)}>
                {t("retry")}
              </Button>
            )}
          </div>
        )}
        <AttemptResult
          record={record}
          isFinish={false}
          onListen={listen}
          onNext={() => {
            if (recording) cancelMic();
            onFinished({ score: record.best, skipped: false });
          }}
          extraActions={
            <Button
              variant={recording ? "danger" : "secondary"}
              size="sm"
              leftIcon={<Icon name={recording ? "square" : "mic"} />}
              disabled={scoring}
              isLoading={scoring}
              onClick={onMicClick}
            >
              {scoring ? t("shadowing.scoring") : recording ? t("shadowing.stop") : t("shadowing.recordAgain")}
            </Button>
          }
        />
        <ReviewPromptDialog prompt={reviewPrompt} setReview={setReview} onClose={() => setReviewPrompt(null)} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">{t("shadowing.hint")}</p>
      <div className="rounded-xl border border-border bg-bg-elevated px-5 py-4 shadow-sm">
        <WordSourceProvider sentenceId={sentence.sentenceId}>
          <p className="text-[19px] font-semibold leading-snug text-text">
            <ClickableText text={sentence.text} />
          </p>
        </WordSourceProvider>
        {sentence.textVi && <p className="mt-1.5 text-sm text-text-muted">{sentence.textVi}</p>}
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-dashed border-warning bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-3.5 py-3 text-sm">
          <span>{t(error)}</span>
          {lastWav && error !== "errors.mic" && error !== "errors.tooShort" && (
            <Button variant="text" size="sm" onClick={() => submit(lastWav)}>
              {t("retry")}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="ghost" leftIcon={<Icon name="volume-2" />} disabled={!canPlay || recording || scoring} onClick={listen}>
          {t("shadowing.listen")}
        </Button>
        <Button
          variant={recording ? "danger" : "primary"}
          leftIcon={<Icon name={recording ? "square" : "mic"} />}
          disabled={scoring}
          isLoading={scoring}
          onClick={onMicClick}
        >
          {scoring ? t("shadowing.scoring") : recording ? t("shadowing.stop") : t("shadowing.record")}
        </Button>
        <span className="grow" />
        <Button
          variant="text"
          size="sm"
          disabled={recording || scoring}
          onClick={() => {
            toast(t("skipped"), { icon: "skip-forward" });
            onFinished({ score: null, skipped: true });
          }}
        >
          {t("skip")}
        </Button>
      </div>
    </div>
  );
}
