import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { formatTimeMs } from "@/lib/format";
import type { PlayerApi } from "../usePlayer";
import type { DictationSentence } from "../types";

export interface MediaBarProps {
  player: PlayerApi;
  /** Phần tử chứa video YouTube; luôn được vẽ để trình phát không bị hủy khi ẩn video. */
  videoRef: RefObject<HTMLDivElement | null>;
  sentences: DictationSentence[];
  currentIndex: number;
  lessonDurationSec: number | null;
  hideVideo: boolean;
  onToggleVideo: () => void;
  onSelect: (index: number) => void;
}

interface NoticeProps {
  icon: string;
  title: string;
  description: string;
  role: "status" | "alert";
  action?: { label: string; onClick: () => void };
}

const Notice = ({ icon, title, description, role, action }: NoticeProps) => (
  <div
    role={role}
    className="flex items-center gap-3 rounded-md border border-dashed border-warning bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-3.5 py-3"
  >
    <Icon name={icon} className="h-6 w-6 flex-none text-warning" />
    <div className="flex-1">
      <b>{title}</b>
      <p className="text-[13px] text-text-muted">{description}</p>
    </div>
    {action && (
      <Button variant="ghost" size="sm" leftIcon={<Icon name="rotate-cw" />} onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

/** Thẻ phương tiện (`renderMedia` của mockup): video, thời gian, thanh các câu và thẻ lỗi. */
export default function MediaBar({
  player,
  videoRef,
  sentences,
  currentIndex,
  lessonDurationSec,
  hideVideo,
  onToggleVideo,
  onSelect,
}: MediaBarProps) {
  const { t } = useTranslation("dictation");
  const lastEnd = sentences.length ? sentences[sentences.length - 1].endMs : 0;
  const totalMs = player.durationMs || (lessonDurationSec ? lessonDurationSec * 1000 : 0) || lastEnd || 1;
  const pct = (ms: number) => Math.min(100, Math.max(0, (ms / totalMs) * 100));
  const current = sentences[currentIndex];
  const shownMs = player.playing ? player.currentMs : (current?.startMs ?? 0);
  const isYouTube = player.kind === "youtube";

  return (
    <div
      className={`relative flex flex-col gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 shadow-[var(--shadow-card)] ${
        player.playing ? "[&_.video-box]:shadow-[0_0_0_2px_var(--fn-dictation)]" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-glass px-2.5 py-1 text-xs font-semibold">
          <Icon name={isYouTube ? "youtube" : "audio-lines"} />
          {isYouTube ? t("media.youtube") : t("media.audio")}
        </span>
        <span className="whitespace-nowrap text-[13px] tabular-nums">
          <b>{formatTimeMs(shownMs)}</b>
          <span className="text-text-muted"> / {formatTimeMs(totalMs)}</span>
        </span>
        <div
          role="group"
          aria-label={t("media.sentences")}
          className="relative order-3 h-7 min-w-[140px] basis-full md:order-none md:basis-auto md:flex-1"
        >
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-sm bg-border" />
          {sentences.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={t("media.sentenceN", { n: i + 1 })}
              aria-current={i === currentIndex ? "true" : undefined}
              onClick={() => onSelect(i)}
              style={{ left: `${pct(s.startMs)}%`, width: `${Math.max(1.2, pct(s.endMs) - pct(s.startMs))}%` }}
              className={`absolute top-1/2 h-3 min-w-2 -translate-y-1/2 cursor-pointer rounded-md p-0 transition-[background-color,transform] duration-150 hover:scale-y-125 ${
                i === currentIndex ? "bg-fn-dictation" : s.latest ? "bg-success" : "bg-border-strong hover:bg-text-subtle"
              }`}
            />
          ))}
          <span
            aria-hidden="true"
            style={{ left: `${pct(shownMs)}%` }}
            className="pointer-events-none absolute bottom-1 top-1 w-0.5 rounded-[1px] bg-text"
          />
        </div>
        {isYouTube && player.status !== "failed" && (
          <Button variant="ghost" size="sm" aria-pressed={hideVideo} onClick={onToggleVideo} leftIcon={<Icon name={hideVideo ? "video" : "ear"} />}>
            {hideVideo ? t("media.showVideo") : t("media.hideVideo")}
          </Button>
        )}
      </div>

      {isYouTube && (
        <div
          className={`video-box relative mx-auto aspect-video w-[min(100%,560px)] overflow-hidden rounded-lg bg-black transition-[margin] duration-[400ms] ${
            hideVideo || player.status === "failed" ? "!h-0 !aspect-auto -mt-2.5" : ""
          }`}
        >
          <div ref={videoRef} className="h-full w-full [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0" />
        </div>
      )}

      {player.status === "failed" && (
        <Notice
          role="alert"
          icon="video-off"
          title={t("media.failTitle")}
          description={t("media.failDesc")}
          action={{ label: t("media.reload"), onClick: player.retry }}
        />
      )}
      {player.status === "blocked" && (
        <Notice role="alert" icon="volume-x" title={t("media.blockedTitle")} description={t("media.blockedDesc")} action={{ label: t("media.reload"), onClick: player.retry }} />
      )}
      {player.status === "nosource" && (
        <Notice role="status" icon="video-off" title={t("media.noSourceTitle")} description={t("media.noSourceDesc")} />
      )}
    </div>
  );
}
