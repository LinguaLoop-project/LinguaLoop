import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import MediaBar from "@/features/dictation/components/MediaBar";
import { usePlayer } from "@/features/dictation/usePlayer";
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
 * Ôn một câu một lúc (UC-HT-04), dùng chung cho "Ôn câu" riêng và chặng câu của phiên Ôn tập hằng ngày. Cả phiên chỉ có
 * một trình phát YouTube: video chỉ dựng lại khi sang câu của bài khác. Danh sách câu và thứ tự do server chọn (BR-HT-20).
 */
export default function SentenceReviewFlow({ sentences, index, onFinished }: SentenceReviewFlowProps) {
  const { t } = useTranslation("review");
  const sentence = sentences[index];
  const videoRef = useRef<HTMLDivElement>(null);
  const [hideVideo, setHideVideo] = useState(false);
  const player = usePlayer({ videoId: sentence.youtubeId, mediaUrl: null, containerRef: videoRef, rate: 1 });

  const finish = (outcome: StepOutcome) => onFinished({ sentenceId: sentence.sentenceId, mode: sentence.mode, ...outcome });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
        <Badge tone={sentence.mode === "dictation" ? "info" : "success"}>{t(`mode.${sentence.mode}`)}</Badge>
        <span className="truncate">{sentence.lessonTitle}</span>
      </div>
      <MediaBar player={player} videoRef={videoRef} hideVideo={hideVideo} onToggleVideo={() => setHideVideo((value) => !value)} />
      {sentence.mode === "dictation" ? (
        <DictationReviewStep key={sentence.sentenceId} sentence={sentence} player={player} onFinished={finish} />
      ) : (
        <ShadowingReviewStep key={sentence.sentenceId} sentence={sentence} player={player} onFinished={finish} />
      )}
    </div>
  );
}
