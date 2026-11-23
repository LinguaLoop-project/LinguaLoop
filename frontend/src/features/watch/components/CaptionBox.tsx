import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { LookupWord, splitWords, WordSourceProvider } from "@/features/dictionary";
import { activeWordIndex } from "../feed";
import type { CaptionSize, WatchPrefs } from "../prefs";
import type { WatchLine } from "../types";

const SIZE_CLASS: Record<CaptionSize, { en: string; sub: string }> = {
  sm: { en: "text-sm md:text-lg", sub: "text-xs md:text-sm" },
  md: { en: "text-base md:text-[22px]", sub: "text-xs md:text-base" },
  lg: { en: "text-lg md:text-[28px]", sub: "text-sm md:text-lg" },
};

export interface CaptionBoxProps {
  line: WatchLine;
  currentMs: number;
  prefs: WatchPrefs;
  /** Chỉ số câu hiện tại (0-based) và tổng số câu để hiển thị điều hướng câu. */
  lineIndex?: number;
  totalLines?: number;
  onPrevLine?: () => void;
  onReplayLine?: () => void;
  onNextLine?: () => void;
  /** Hộp tra từ mở hoặc đóng: video tạm dừng rồi phát tiếp (BR-TC-14). */
  onLookupChange: (open: boolean) => void;
  /** Lưu hoặc bỏ lưu câu đang hiện vào Câu cần ôn (BR-TC-17). */
  onToggleSave: () => void;
}

/**
 * Câu đang nói trên video: mỗi từ bấm vào là tra từ điển; từ đang nói (ước lượng theo độ dài từ) được tô vàng. Bản dịch và
 * phiên âm hiện theo lựa chọn trong Cài đặt. Nút dấu trang ở góc trên phải khung lưu đúng câu này vào Câu cần ôn.
 */
export default function CaptionBox({
  line,
  currentMs,
  prefs,
  lineIndex,
  totalLines,
  onPrevLine,
  onReplayLine,
  onNextLine,
  onLookupChange,
  onToggleSave,
}: Readonly<CaptionBoxProps>) {
  const { t } = useTranslation("watch");
  const parts = useMemo(() => splitWords(line.textEn), [line.textEn]);
  const words = useMemo(() => parts.filter((part) => part.isWord).map((part) => part.text), [parts]);
  // Chỉ số từ (không tính dấu câu) của từng đoạn; -1 cho đoạn không phải từ.
  const wordIndexes = useMemo(() => {
    let next = 0;
    return parts.map((part) => (part.isWord ? next++ : -1));
  }, [parts]);
  const activeWord = activeWordIndex(words, line, currentMs);
  const size = SIZE_CLASS[prefs.size];
  const label = line.saved ? t("actions.savedLine") : t("actions.saveLine");
  const hasSentenceNav = typeof lineIndex === "number" && typeof totalLines === "number" && totalLines > 0;

  return (
    <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-1.5">
      {hasSentenceNav && (
        <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-1.5 py-1 text-[11px] font-semibold text-white/85 shadow-md backdrop-blur-md">
          {onPrevLine && (
            <button
              type="button"
              aria-label={t("caption.prev")}
              title={t("caption.prevTitle")}
              disabled={lineIndex <= 0}
              onClick={onPrevLine}
              className="grid size-6 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Icon name="chevron-left" className="size-3.5" />
            </button>
          )}
          <span className="px-2 tabular-nums text-white/90">
            {t("caption.position", { current: lineIndex + 1, total: totalLines })}
          </span>
          {onReplayLine && (
            <button
              type="button"
              aria-label={t("caption.replay")}
              title={t("caption.replayTitle")}
              onClick={onReplayLine}
              className="grid size-6 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            >
              <Icon name="rotate-ccw" className="size-3" />
            </button>
          )}
          {onNextLine && (
            <button
              type="button"
              aria-label={t("caption.next")}
              title={t("caption.nextTitle")}
              disabled={lineIndex >= totalLines - 1}
              onClick={onNextLine}
              className="grid size-6 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Icon name="chevron-right" className="size-3.5" />
            </button>
          )}
          {!prefs.captions && (
            <button
              type="button"
              aria-label={label}
              aria-pressed={line.saved}
              title={label}
              onClick={onToggleSave}
              className={`ml-0.5 grid size-6 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/25 ${
                line.saved ? "text-video-accent" : "text-white/85 hover:text-white"
              }`}
            >
              <Icon name={line.saved ? "bookmark-check" : "bookmark-plus"} className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {prefs.captions && (
        <div className="relative mx-auto w-fit max-w-full">
          <div className="max-h-[34dvh] overflow-y-auto rounded-2xl border border-white/15 bg-black/78 px-4 py-2.5 text-center shadow-[0_12px_32px_-8px_rgba(0,0,0,0.85)] backdrop-blur-md md:px-6 md:py-3">
            <WordSourceProvider sentenceId={line.id}>
              <p lang="en" className={`font-semibold leading-relaxed text-white ${size.en}`}>
                {parts.map((part, i) => {
                  if (!part.isWord) return <span key={i}>{part.text}</span>;
                  const speaking = wordIndexes[i] === activeWord;
                  return (
                    <LookupWord
                      key={i}
                      word={part.text}
                      onOpenChange={onLookupChange}
                      className={`underline decoration-white/45 decoration-dotted decoration-2 underline-offset-[6px] transition-colors duration-100 ${
                        speaking ? "text-video-accent" : ""
                      }`}
                    />
                  );
                })}
              </p>
            </WordSourceProvider>
            {prefs.ipa && line.ipaUs && <p className={`mt-1 font-mono text-white/75 ${size.sub}`}>/{line.ipaUs}/</p>}
            {prefs.translation && line.textVi && (
              <p lang="vi" className={`mt-1 font-medium text-video-accent-soft ${size.sub}`}>
                {line.textVi}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={label}
            aria-pressed={line.saved}
            title={label}
            onClick={onToggleSave}
            className={`absolute -right-3 -top-3 grid size-8 cursor-pointer place-items-center rounded-full border border-white/25 bg-black/90 shadow-lg transition-[transform,color] duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
              line.saved ? "text-video-accent" : "text-white/80 hover:text-white"
            }`}
          >
            <Icon name={line.saved ? "bookmark-check" : "bookmark-plus"} className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
