import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { fmtClock, fmtDuration, sentenceAt } from "../utils";

const K = "student.shadowingPractice";

export interface TimelineSegment {
  startMs: number;
  endMs: number;
  /** Đã được chấm ít nhất một lần. */
  done: boolean;
}

export interface MediaBarProps {
  /** Đang dùng video YouTube (hiện nút ẩn video). */
  video: boolean;
  positionMs: number;
  durationMs: number;
  segments: TimelineSegment[];
  current: number;
  disabled: boolean;
  hideVideo: boolean;
  onToggleVideo: () => void;
  /** Kéo thanh tua: hiện câu chứa vị trí đang kéo. */
  onScrub: (index: number) => void;
  /** Thả thanh tua: chiếu đoạn mẫu của câu đó. */
  onCommit: (index: number) => void;
  /** Khung video và thông báo lỗi video. */
  children?: ReactNode;
}

/** Khung video kèm thanh tua gắn liền bên dưới: kéo tới đâu thì hiện câu chứa đoạn đó. */
export default function MediaBar({
  video,
  positionMs,
  durationMs,
  segments,
  current,
  disabled,
  hideVideo,
  onToggleVideo,
  onScrub,
  onCommit,
  children,
}: MediaBarProps) {
  const { t } = useTranslation("pages");
  const total = Math.max(durationMs, 1);
  const [dragMs, setDragMs] = useState<number | null>(null);
  const shownMs = dragMs ?? positionMs;
  const pct = Math.min(100, Math.max(0, (shownMs / total) * 100));

  const commit = () => {
    if (dragMs === null) return;
    const i = sentenceAt(segments, dragMs);
    setDragMs(null);
    onCommit(i);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
      {children && <div className="flex flex-col gap-3 p-3.5 pb-0">{children}</div>}

      <div className="flex items-center gap-3 px-4 py-3">
        <span className="whitespace-nowrap text-sm tabular-nums">
          <b>{fmtClock(shownMs)}</b>
          <span className="text-text-muted"> / {fmtDuration(total)}</span>
        </span>

        <div className="group relative h-7 min-w-36 flex-1" role="group" aria-label={t(`${K}.result.timeline`)}>
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-sm bg-border" />
          {segments.map((s, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                left: `${(s.startMs / total) * 100}%`,
                width: `${Math.max(1.2, ((s.endMs - s.startMs) / total) * 100)}%`,
              }}
              className={`pointer-events-none absolute top-1/2 h-2 min-w-2 -translate-y-1/2 rounded-md transition-colors ${
                i === current ? "bg-fn-shadowing" : s.done ? "bg-success" : "bg-border-strong"
              }`}
            />
          ))}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fn-shadowing bg-surface shadow transition-transform group-hover:scale-110"
            style={{ left: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={Math.round(total)}
            step={100}
            value={Math.round(shownMs)}
            disabled={disabled}
            aria-label={t(`${K}.result.timeline`)}
            aria-valuetext={t(`${K}.sentenceOf`, { n: current + 1, total: segments.length })}
            onChange={(e) => {
              const ms = Number(e.target.value);
              setDragMs(ms);
              onScrub(sentenceAt(segments, ms));
            }}
            onPointerUp={commit}
            onKeyUp={commit}
            onBlur={commit}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </div>

        {video && (
          <button
            type="button"
            aria-pressed={hideVideo}
            aria-label={hideVideo ? t(`${K}.video.show`) : t(`${K}.video.hide`)}
            title={hideVideo ? t(`${K}.video.show`) : t(`${K}.video.hide`)}
            onClick={onToggleVideo}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-border-strong bg-transparent text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Icon name={hideVideo ? "eye" : "eye-off"} />
          </button>
        )}
      </div>
    </div>
  );
}
