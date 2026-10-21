import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Mascot from "@/components/common/Mascot";
import type { PracticeWord } from "../types";

const K = "student.tutor.offer";

export interface TutorOfferProps {
  words: PracticeWord[];
  /** Hết đếm ngược hoặc bấm "Vào ngay": mở Phiên gia sư. */
  onStart: () => void;
  /** "Bỏ qua câu này": không mở gia sư cho câu vừa đọc. */
  onSkip: () => void;
  seconds?: number;
}

/**
 * Chế độ gia sư đang bật: gia sư tự mở sau một đếm ngược ngắn, đủ để xem điểm câu và bỏ qua, không phải trả lời câu
 * hỏi nào.
 */
export default function TutorOffer({ words, onStart, onSkip, seconds = 3 }: TutorOfferProps) {
  const { t } = useTranslation("pages");
  const [left, setLeft] = useState(seconds);
  const fired = useRef(false);

  const start = () => {
    if (fired.current) return;
    fired.current = true;
    onStart();
  };

  useEffect(() => {
    const timer = setInterval(() => setLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (left > 0 || fired.current) return;
    fired.current = true;
    onStart();
  }, [left, onStart]);

  const listed = words.slice(0, 3).map((w) => (w.phoneme ? `${w.word} /${w.phoneme}/` : w.word));
  const extra = words.length - listed.length;
  const progress = Math.max(left, 0) / seconds;

  return (
    <div role="status" className="flex items-start gap-4 rounded-lg border border-primary bg-primary-soft p-4">
      <Mascot mood="speaking" size={56} alt="" className="hidden sm:block" />
      <div className="min-w-0 flex-1">
        <p>
          {t(`${K}.text`, { count: words.length })} <b>{listed.join(", ")}</b>
          {extra > 0 && t(`${K}.extra`, { count: extra })}. {t(`${K}.soon`, { seconds: Math.max(left, 0) })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={start}>
            {t(`${K}.now`)}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              fired.current = true;
              onSkip();
            }}
          >
            {t(`${K}.skip`)}
          </Button>
        </div>
      </div>
      <div
        aria-hidden
        className="h-9 w-9 flex-none rounded-full transition-[background] duration-1000 ease-linear"
        style={{
          background: `conic-gradient(var(--primary) ${progress * 360}deg, var(--border) 0)`,
          WebkitMask: "radial-gradient(circle 12px, transparent 98%, #000)",
          mask: "radial-gradient(circle 12px, transparent 98%, #000)",
        }}
      />
    </div>
  );
}
