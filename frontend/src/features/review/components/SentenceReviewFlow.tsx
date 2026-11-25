import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import MediaBar from "@/features/dictation/components/MediaBar";
import { usePlayer } from "@/features/dictation/usePlayer";
import { useSkipSentence } from "../hooks";
import type { PlanSentence, SentenceOutcome } from "../types";
import DictationReviewStep from "./DictationReviewStep";
import ShadowingReviewStep from "./ShadowingReviewStep";
import type { StepOutcome } from "./stepTypes";

export interface SentenceReviewFlowProps {
  sentences: readonly PlanSentence[];
  /** Câu đang ôn (từ 0). Do khung ngoài giữ để thanh tiến độ chung hiện đúng. */
  index: number;
  /** Học viên bấm sang câu tiếp theo (hoặc bỏ qua câu này). */
  onFinished: (outcome: SentenceOutcome) => void;
}

/**
 * Ôn một câu một lúc (UC-HT-04), dùng chung cho "Ôn câu" riêng và chặng câu của phiên Luyện tập hằng ngày. Cả phiên chỉ có
 * một trình phát YouTube: video chỉ dựng lại khi sang câu của bài khác. Danh sách câu và thứ tự do server chọn (BR-HT-20).
 */
export default function SentenceReviewFlow({ sentences, index, onFinished }: SentenceReviewFlowProps) {
  const { t } = useTranslation("review");
  const sentence = sentences[index];
  const videoRef = useRef<HTMLDivElement>(null);
  const [hideVideo, setHideVideo] = useState(false);
  const player = usePlayer({ videoId: sentence.youtubeId, mediaUrl: null, containerRef: videoRef, rate: 1 });

  const skip = useSkipSentence();

  const finish = (outcome: StepOutcome) => {
    // Câu bỏ qua được hoãn sang ngày mai để không quay lại đầu danh sách ở phiên sau (BR-HT-21).
    if (outcome.skipped) skip.mutate({ mode: sentence.mode, sentenceId: sentence.sentenceId });
    onFinished({ sentenceId: sentence.sentenceId, mode: sentence.mode, ...outcome });
  };

  const isDictation = sentence.mode === "dictation";

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border bg-surface p-5 shadow-[var(--shadow-card)] ${
        isDictation ? "border-t-2 border-border border-t-fn-dictation" : "border-t-2 border-border border-t-fn-shadowing"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-sm text-text-muted">
        <div className="flex min-w-0 items-center gap-2.5">
          <Badge tone={isDictation ? "info" : "success"}>
            <Icon name={isDictation ? "headphones" : "mic"} className="mr-1 h-3.5 w-3.5" />
            {t(`mode.${sentence.mode}`)}
          </Badge>
          {sentence.extra && (
            <span title={t("source.extraSentenceHint")}>
              <Badge variant="warning">{t("source.extraSentence")}</Badge>
            </span>
          )}
          <Link
            to={`/student/lessons/${sentence.lessonId}`}
            className="truncate font-semibold text-text transition-colors hover:text-primary-text"
          >
            {sentence.lessonTitle}
          </Link>
        </div>
        <span className="rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs font-semibold tabular-nums text-text-muted">
          {index + 1}/{sentences.length}
        </span>
      </div>

      <div className={`grid grid-cols-1 items-start gap-5 ${hideVideo ? "" : "lg:grid-cols-[minmax(320px,5fr)_minmax(0,7fr)]"}`}>
        <MediaBar player={player} videoRef={videoRef} hideVideo={hideVideo} onToggleVideo={() => setHideVideo((value) => !value)} />

        <div className="min-w-0">
          {isDictation ? (
            <DictationReviewStep key={sentence.sentenceId} sentence={sentence} player={player} onFinished={finish} />
          ) : (
            <ShadowingReviewStep key={sentence.sentenceId} sentence={sentence} player={player} onFinished={finish} />
          )}
        </div>
      </div>
    </div>
  );
}
