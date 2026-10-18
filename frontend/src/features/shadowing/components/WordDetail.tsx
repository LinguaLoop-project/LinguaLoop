import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { speakSegment } from "../hooks/useModelPlayer";
import type { WordResult } from "../types";
import { PHONEME_ERROR_BELOW, TONE_BOX, TONE_TEXT, toneOf } from "../utils";

export interface WordDetailProps {
  word: WordResult;
  /** Phiên âm mẫu của từ trong câu; null khi dữ liệu câu không có hoặc không khớp. */
  ipa: string | null;
  onClose: () => void;
}

/** Chi tiết một từ: điểm, từng âm vị kèm điểm, âm dưới 60 được đánh dấu (UC-SHADOW-06 kịch bản 3). */
export default function WordDetail({ word, ipa, onClose }: WordDetailProps) {
  const { t } = useTranslation("pages");
  const k = "student.shadowingPractice";
  const omitted = word.outcome === "omitted";
  const weak = word.phonemes.find((p) => p.accuracy < PHONEME_ERROR_BELOW);
  const tone = omitted ? "bad" : toneOf(word.accuracy);

  const tip = omitted
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
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => speakSegment(word.word, 0.8, () => undefined)}
            aria-label={t(`${k}.word.speak`, { word: word.word })}
          >
            <Icon name="volume-2" />
          </Button>
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

      <p className="mt-3 text-sm text-text-muted">{tip}</p>
    </div>
  );
}
