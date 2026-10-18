import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import SegmentedControl from "@/components/common/SegmentedControl";
import { RATES } from "../hooks/useShadowingSettings";

const K = "student.shadowingPractice";

export type RecordPhase = "idle" | "recording" | "scoring";

export interface ControlBarProps {
  isFirst: boolean;
  isLast: boolean;
  playing: boolean;
  rate: string;
  phase: RecordPhase;
  micLabel: string;
  levels: number[];
  canPlayMine: boolean;
  /** Chặn đổi câu khi đang ghi âm hoặc chấm. */
  navDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReplay: () => void;
  onTogglePlay: () => void;
  onRate: (rate: string) => void;
  onMine: () => void;
  onCompare: () => void;
  onMic: () => void;
}

function Waveform({ levels }: { levels: number[] }) {
  return (
    <div className="flex h-9 items-center justify-center gap-[3px]" aria-hidden="true">
      {levels.map((l, i) => (
        <span key={i} className="w-[3px] rounded-full bg-danger" style={{ height: `${Math.max(10, l * 100)}%` }} />
      ))}
    </div>
  );
}

/** Thanh điều khiển gộp (`dc-ctrl`): ← ↻ ▶ → · tốc độ · giọng tôi · so sánh · mic. */
export default function ControlBar(p: ControlBarProps) {
  const { t } = useTranslation("pages");
  const micIcon = p.phase === "scoring" ? "loader-circle" : p.phase === "recording" ? "square" : "mic";

  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
      <div role="toolbar" aria-label={t(`${K}.controls.label`)} className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" iconOnly disabled={p.isFirst || p.navDisabled} onClick={p.onPrev} aria-label={t(`${K}.prev`)}>
          <Icon name="chevron-left" />
        </Button>
        <Button variant="ghost" iconOnly disabled={p.phase === "recording"} onClick={p.onReplay} aria-label={t(`${K}.controls.replay`)}>
          <Icon name="rotate-ccw" />
        </Button>
        <button
          type="button"
          onClick={p.onTogglePlay}
          disabled={p.phase === "recording"}
          aria-label={p.playing ? t(`${K}.controls.pause`) : t(`${K}.controls.play`)}
          className="relative grid h-[52px] w-[52px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-fn-shadowing text-[26px] text-on-fn shadow-[0_4px_0_color-mix(in_srgb,var(--fn-shadowing)_60%,#000)] transition-[transform,box-shadow] duration-150 active:translate-y-[3px] active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-fn-shadowing disabled:cursor-not-allowed disabled:opacity-60 md:h-[60px] md:w-[60px]"
        >
          {p.playing && (
            <span aria-hidden="true" className="animate-ripple pointer-events-none absolute -inset-1.5 rounded-full border-2 border-fn-shadowing" />
          )}
          <Icon name={p.playing ? "pause" : "play"} fill />
        </button>
        <Button variant="ghost" iconOnly disabled={p.isLast || p.navDisabled} onClick={p.onNext} aria-label={t(`${K}.next`)}>
          <Icon name="chevron-right" />
        </Button>

        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <SegmentedControl
          ariaLabel={t(`${K}.speed`)}
          options={RATES.map((r) => ({ value: r, label: `${r}×` }))}
          value={p.rate}
          onChange={p.onRate}
        />

        <span className="flex-1" />
        <Button variant="ghost" disabled={!p.canPlayMine || p.navDisabled} onClick={p.onMine} leftIcon={<Icon name="play" />}>
          {t(`${K}.mine`)}
        </Button>
        <Button variant="ghost" disabled={!p.canPlayMine || p.navDisabled} onClick={p.onCompare} leftIcon={<Icon name="arrow-left-right" />}>
          {t(`${K}.compare`)}
        </Button>
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={p.onMic}
            disabled={p.phase === "scoring"}
            aria-label={p.micLabel}
            className={`relative grid h-16 w-16 shrink-0 cursor-pointer place-items-center rounded-full border-0 text-[28px] text-white transition-transform duration-200 ease-[var(--ease-spring)] hover:scale-105 disabled:cursor-wait ${
              p.phase === "recording" ? "bg-danger" : p.phase === "scoring" ? "bg-text-subtle" : "bg-primary"
            }`}
          >
            {p.phase === "recording" && (
              <span aria-hidden="true" className="animate-ripple pointer-events-none absolute -inset-2.5 rounded-full border-[3px] border-danger" />
            )}
            <Icon name={micIcon} className={p.phase === "scoring" ? "animate-spin" : ""} fill={p.phase === "idle"} />
          </button>
          <span role="status" aria-live="polite" className="whitespace-nowrap text-[11px] text-text-muted">
            {p.micLabel}
          </span>
        </div>
      </div>
      {p.phase === "recording" && <Waveform levels={p.levels} />}
    </div>
  );
}
