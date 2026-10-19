import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { LEVEL_CHIP } from "../utils";
import type { DictationLevel, PlaybackRate } from "../types";

const RATES: PlaybackRate[] = [0.5, 0.75, 1];

export interface PlayerControlsProps {
  index: number;
  total: number;
  replays: number;
  level: DictationLevel;
  playing: boolean;
  /** Chưa thể phát (đang tải, hỏng hoặc không có nguồn): nút phát bị tắt. */
  canPlay: boolean;
  rate: PlaybackRate;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onReplay: () => void;
  onRate: (rate: PlaybackRate) => void;
}

/** Số câu, số lần đã nghe, mức và bộ nút phát (`controlsHtml` của mockup). */
export default function PlayerControls({
  index,
  total,
  replays,
  level,
  playing,
  canPlay,
  rate,
  onPrev,
  onNext,
  onPlay,
  onReplay,
  onRate,
}: PlayerControlsProps) {
  const { t } = useTranslation("dictation");
  return (
    <>
      <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
        <b className="text-base">{t("meta.sentence", { n: index + 1, total })}</b>
        <span className="text-[13px] text-text-muted">{t("meta.replays", { count: replays })}</span>
        <span className="grow" />
        <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] ${LEVEL_CHIP[level]}`}>
          {t(`level.${level}`)}
        </span>
        <span className="hidden text-[13px] text-text-muted md:inline">{t(`level.${level}Help`)}</span>
      </div>
      <div
        role="toolbar"
        aria-label={t("controls.group")}
        className="mb-2.5 flex flex-wrap items-center gap-2 border-b border-border pb-2.5"
      >
        <Button variant="ghost" iconOnly aria-label={t("controls.prev")} disabled={index === 0} onClick={onPrev}>
          <Icon name="chevron-left" />
        </Button>
        <Button variant="ghost" iconOnly aria-label={t("controls.replay")} disabled={!canPlay} onClick={onReplay}>
          <Icon name="rotate-ccw" />
        </Button>
        <button
          type="button"
          disabled={!canPlay}
          aria-label={playing ? t("controls.pause") : t("controls.play")}
          onClick={onPlay}
          className="relative grid h-[52px] w-[52px] flex-none cursor-pointer place-items-center rounded-full bg-fn-dictation text-on-fn shadow-[0_4px_0_color-mix(in_srgb,var(--fn-dictation)_60%,#000)] transition-[transform,box-shadow] duration-150 active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-fn-dictation"
        >
          <Icon name={playing ? "pause" : "play"} fill className="h-6 w-6" />
          {playing && (
            <span aria-hidden="true" className="absolute -inset-1.5 animate-ping rounded-full border-2 border-fn-dictation" />
          )}
        </button>
        <Button variant="ghost" iconOnly aria-label={t("controls.next")} disabled={index === total - 1} onClick={onNext}>
          <Icon name="chevron-right" />
        </Button>
        <span aria-hidden="true" className="mx-1.5 hidden h-7 w-px bg-border md:block" />
        <div role="group" aria-label={t("controls.rate")} className="inline-flex gap-0.5 rounded-md border border-border bg-surface p-1">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === rate}
              onClick={() => onRate(r)}
              className={`inline-flex h-9 cursor-pointer items-center rounded-sm px-3 text-sm transition-colors duration-150 ${
                r === rate
                  ? "bg-primary-soft font-semibold text-text shadow-[inset_0_0_0_1px_var(--border-strong)]"
                  : "font-medium text-text-muted hover:text-text"
              }`}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
