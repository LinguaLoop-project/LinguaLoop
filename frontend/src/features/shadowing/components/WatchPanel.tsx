import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";

const K = "student.shadowingPractice.watch";

export interface WatchPanelProps {
  playing: boolean;
  /** Số thứ tự câu đang ở (bắt đầu từ 1). */
  sentenceNo: number;
  subtitles: boolean;
  /** Chữ của câu đang phát, hiện khi bật phụ đề. */
  caption: string;
  onToggle: () => void;
  onPractice: () => void;
}

/** Nội dung tab Xem: phát liền mạch cả bài, danh sách câu bên cạnh sáng theo lời nói. */
export default function WatchPanel({ playing, sentenceNo, subtitles, caption, onToggle, onPractice }: WatchPanelProps) {
  const { t } = useTranslation("pages");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <b>{t(`${K}.title`)}</b>
        <p className="text-sm text-text-muted">{t(`${K}.hint`)}</p>
      </div>
      {subtitles && (
        <p aria-live="polite" className="min-h-14 rounded-md bg-bg-elevated px-4 py-3 font-display text-xl leading-snug">
          {caption}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={onToggle} leftIcon={<Icon name={playing ? "pause" : "play"} />}>
          {playing ? t(`${K}.pause`) : t(`${K}.playFrom`, { n: sentenceNo })}
        </Button>
        <Button variant="ghost" size="lg" onClick={onPractice} leftIcon={<Icon name="mic" />}>
          {t(`${K}.practiceThis`)}
        </Button>
      </div>
      {!subtitles && <p className="text-sm text-text-muted">{t(`${K}.subsOff`)}</p>}
    </div>
  );
}
