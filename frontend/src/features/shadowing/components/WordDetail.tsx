import { useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { speakSegment } from "../hooks/useModelPlayer";
import type { WordResult } from "../types";
import { PHONEME_ERROR_BELOW, TONE_BOX, TONE_TEXT, toneOf, youtubeId } from "../utils";

export interface WordDetailProps {
  word: WordResult;
  /** Phiên âm mẫu của từ trong câu; null khi dữ liệu câu không có hoặc không khớp. */
  ipa: string | null;
  onClose: () => void;
  /** Mở hộp mời nâng cấp Pro (video khẩu hình bị khoá với gói Free). */
  onUpgrade: () => void;
}

/** Chi tiết một từ: điểm, từng âm vị kèm điểm, âm dưới 60 được đánh dấu (UC-SHADOW-06 kịch bản 3). */
export default function WordDetail({ word, ipa, onClose, onUpgrade }: WordDetailProps) {
  const { t } = useTranslation("pages");
  const k = "student.shadowingPractice";
  const omitted = word.outcome === "omitted";
  const weak = word.phonemes.find((p) => p.accuracy < PHONEME_ERROR_BELOW);
  const tone = omitted ? "bad" : toneOf(word.accuracy);
  const [videoOpen, setVideoOpen] = useState(false);
  const video = weak?.mouthVideo ?? null;
  const embedId = video?.url ? youtubeId(video.url) : null;

  const tip = weak?.tip ? weak.tip : omitted
    ? t(`${k}.detail.omittedWord`)
    : weak
      ? t(`${k}.detail.badPhoneme`, { symbol: weak.symbol })
      : word.phonemes.length === 0
        ? t(`${k}.detail.noPhonemes`)
        : word.accuracy >= 80
          ? t(`${k}.detail.goodWord`)
          : t(`${k}.detail.slowWord`);

  return (
    <div role="region" aria-label={word.word} className="rounded-lg border border-border-strong bg-bg-elevated p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <b className="font-display text-xl">{word.word}</b>
          {ipa && <span className="text-base text-text-muted">/{ipa}/</span>}
          {omitted && <span className="text-sm text-danger">{t(`${k}.word.omitted`)}</span>}
          <button
            type="button"
            onClick={() => speakSegment(word.word, 0.8, () => undefined)}
            aria-label={t(`${k}.word.speak`, { word: word.word })}
            className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full border border-info bg-surface py-0 pl-1.5 pr-4 text-sm font-bold text-text transition-colors hover:bg-surface-hover"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-info text-lg text-on-fn">
              <Icon name="volume-2" />
            </span>
            {t(`${k}.word.listen`)}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={tone === "good" ? "success" : tone === "mid" ? "warning" : "danger"}>
            {Math.round(word.accuracy)}
          </Badge>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label={t(`${k}.detail.close`)}>
            <Icon name="x" />
          </Button>
        </div>
      </div>

      {word.phonemes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {word.phonemes.map((p, i) => {
            const pt = toneOf(p.accuracy);
            const bad = p.accuracy < PHONEME_ERROR_BELOW;
            return (
              <li
                key={`${p.symbol}-${i}`}
                className={`min-w-14 rounded-md border px-3 py-2 text-center ${TONE_BOX[pt]}`}
                aria-label={`${p.symbol} ${Math.round(p.accuracy)}${bad ? " !" : ""}`}
              >
                <div className="font-display text-lg">{p.symbol}</div>
                <div className={`text-xs font-semibold tabular-nums ${TONE_TEXT[pt]}`}>{Math.round(p.accuracy)}</div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex items-start gap-2 rounded-md bg-surface-hover px-3 py-2.5 text-sm text-text-muted">
        <Icon name="lightbulb" className="mt-0.5 shrink-0 text-warning" />
        <p>{tip}</p>
      </div>

      {weak && video && (
        <div className="mt-3">
          {video.locked ? (
            <div className="relative flex max-w-[340px] items-center gap-3 overflow-hidden rounded-lg border border-border-strong bg-surface p-3">
              <div aria-hidden="true" className="grid h-14 w-20 shrink-0 place-items-center rounded-md bg-bg-elevated text-2xl text-text-subtle blur-[1.5px]">
                <Icon name="circle-play" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <Badge variant="pro">
                  <Icon name="crown" />
                  PRO
                </Badge>
                <b className="text-sm">{t(`${k}.mouth.title`, { symbol: weak.symbol })}</b>
                <Button size="sm" onClick={onUpgrade}>
                  {t(`${k}.mouth.unlock`)}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setVideoOpen((v) => !v)} aria-expanded={videoOpen} leftIcon={<Icon name="video" />}>
                {videoOpen ? t(`${k}.mouth.hide`) : t(`${k}.mouth.title`, { symbol: weak.symbol })}
              </Button>
              {videoOpen &&
                (embedId ? (
                  <div className="mt-2 aspect-video w-full max-w-[420px] overflow-hidden rounded-lg bg-black">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${embedId}`}
                      title={t(`${k}.mouth.title`, { symbol: weak.symbol })}
                      allow="encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a className="mt-2 inline-block text-sm text-primary-text underline" href={video.url ?? undefined} target="_blank" rel="noreferrer">
                    {t(`${k}.mouth.open`)}
                  </a>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
