import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { fmtClock, fmtDuration } from "../utils";

const K = "student.shadowingPractice";

export interface TimelineSegment {
  startMs: number;
  endMs: number;
  /** Đã được chấm ít nhất một lần. */
  done: boolean;
}

export interface MediaBarProps {
  /** Đang dùng video YouTube (hiện huy hiệu YouTube và nút ẩn video). */
  video: boolean;
  positionMs: number;
  durationMs: number;
  segments: TimelineSegment[];
  current: number;
  disabled: boolean;
  hideVideo: boolean;
  onToggleVideo: () => void;
  onPick: (index: number) => void;
  /** Khung video và thông báo lỗi video. */
  children?: ReactNode;
}

/** Thanh phía trên video (`dc-media-bar`): nguồn phát, đồng hồ, thanh các câu trên trục thời gian, nút ẩn video. */
export default function MediaBar({
  video,
  positionMs,
  durationMs,
  segments,
  current,
  disabled,
  hideVideo,
  onToggleVideo,
  onPick,
  children,
}: MediaBarProps) {
  const { t } = useTranslation("pages");
  const total = Math.max(durationMs, 1);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-strong bg-bg-elevated px-3 text-sm font-semibold">
          <Icon name={video ? "video" : "headphones"} />
          {video ? t(`${K}.video.badge`) : t(`${K}.video.audioBadge`)}
        </span>
        <span className="whitespace-nowrap text-sm tabular-nums">
          <b>{fmtClock(positionMs)}</b>
          <span className="text-text-muted"> / {fmtDuration(total)}</span>
        </span>

        <div className="relative h-7 min-w-36 flex-1" role="group" aria-label={t(`${K}.result.timeline`)}>
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-sm bg-border" />
          {segments.map((s, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-label={t(`${K}.sentenceOf`, { n: i + 1, total: segments.length })}
              aria-current={i === current ? "true" : undefined}
              onClick={() => onPick(i)}
              style={{
                left: `${(s.startMs / total) * 100}%`,
                width: `${Math.max(1.2, ((s.endMs - s.startMs) / total) * 100)}%`,
              }}
              className={`absolute top-1/2 h-3 min-w-2 -translate-y-1/2 cursor-pointer rounded-md border-0 p-0 transition-transform hover:scale-y-125 disabled:cursor-not-allowed ${
                i === current ? "bg-fn-shadowing" : s.done ? "bg-success" : "bg-border-strong hover:bg-text-subtle"
              }`}
            />
          ))}
          {/* Đầu phát */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-sm bg-text"
            style={{ left: `${Math.min(100, Math.max(0, (positionMs / total) * 100))}%` }}
          />
        </div>

        {video && (
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={hideVideo}
            onClick={onToggleVideo}
            leftIcon={<Icon name={hideVideo ? "eye" : "eye-off"} />}
          >
            {hideVideo ? t(`${K}.video.show`) : t(`${K}.video.hide`)}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
