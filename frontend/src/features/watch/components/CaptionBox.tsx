import { useMemo } from "react";
import { LookupWord, splitWords, WordSourceProvider } from "@/features/dictionary";
import { activeWordIndex } from "../feed";
import type { CaptionSize, WatchPrefs } from "../prefs";
import type { WatchLine } from "../types";

const SIZE_CLASS: Record<CaptionSize, { en: string; sub: string }> = {
  sm: { en: "text-base md:text-lg", sub: "text-xs md:text-sm" },
  md: { en: "text-lg md:text-[22px]", sub: "text-sm md:text-base" },
  lg: { en: "text-[22px] md:text-[28px]", sub: "text-base md:text-lg" },
};

export interface CaptionBoxProps {
  line: WatchLine;
  currentMs: number;
  prefs: WatchPrefs;
  /** Hộp tra từ mở hoặc đóng: video tạm dừng rồi phát tiếp (BR-TC-14). */
  onLookupChange: (open: boolean) => void;
}

/**
 * Câu đang nói trên video: mỗi từ bấm vào là tra từ điển; từ đang nói (ước lượng theo độ dài từ) được tô vàng. Bản dịch và
 * phiên âm hiện theo lựa chọn trong Cài đặt.
 */
export default function CaptionBox({ line, currentMs, prefs, onLookupChange }: Readonly<CaptionBoxProps>) {
  const parts = useMemo(() => splitWords(line.textEn), [line.textEn]);
  const words = useMemo(() => parts.filter((part) => part.isWord).map((part) => part.text), [parts]);
  // Chỉ số từ (không tính dấu câu) của từng đoạn; -1 cho đoạn không phải từ.
  const wordIndexes = useMemo(() => {
    let next = 0;
    return parts.map((part) => (part.isWord ? next++ : -1));
  }, [parts]);
  const activeWord = activeWordIndex(words, line, currentMs);
  const size = SIZE_CLASS[prefs.size];

  return (
    <div
      className="mx-auto w-fit max-w-full rounded-xl bg-black/70 px-4 py-2.5 text-center shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] backdrop-blur-sm md:px-6 md:py-3"
    >
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
                  speaking ? "text-[#fcd34d]" : ""
                }`}
              />
            );
          })}
        </p>
      </WordSourceProvider>
      {prefs.ipa && line.ipaUs && (
        <p className={`mt-1 font-mono text-white/70 ${size.sub}`}>/{line.ipaUs}/</p>
      )}
      {prefs.translation && line.textVi && (
        <p lang="vi" className={`mt-1 font-medium text-[#fde68a] ${size.sub}`}>
          {line.textVi}
        </p>
      )}
    </div>
  );
}
