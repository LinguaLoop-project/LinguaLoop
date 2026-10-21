import { useEffect, useRef } from "react";
import Mascot from "@/components/common/Mascot";
import type { MascotMood } from "@/components/common/Mascot";
import type { TutorSessionController } from "../controller";

export interface TutorStageProps {
  controller: TutorSessionController;
  mood: MascotMood;
  /** Lượt chấm đang mở: gia sư tạm không nghe nên Loopi mờ đi. */
  dim?: boolean;
  caption?: string;
}

/**
 * Loopi là giọng nói của gia sư: hai vòng sóng quanh Loopi theo âm lượng của người đang nói. Cập nhật style mỗi khung
 * hình thay vì render lại React; tôn trọng prefers-reduced-motion.
 */
export default function TutorStage({ controller, mood, dim = false, caption }: TutorStageProps) {
  const inner = useRef<HTMLSpanElement>(null);
  const outer = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let smooth = 0;
    const loop = () => {
      const { learner, tutor } = controller.getLevels();
      const target = Math.max(learner, tutor);
      // Lên nhanh, xuống chậm cho mượt
      smooth += (target - smooth) * (target > smooth ? 0.35 : 0.08);
      if (inner.current) {
        inner.current.style.transform = `scale(${1 + smooth * 0.35})`;
        inner.current.style.opacity = String(0.2 + smooth * 0.6);
      }
      if (outer.current) {
        outer.current.style.transform = `scale(${1.1 + smooth * 0.7})`;
        outer.current.style.opacity = String(0.1 + smooth * 0.4);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [controller]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative grid h-[130px] w-[150px] place-items-center">
        <span ref={outer} aria-hidden className="absolute h-28 w-28 rounded-full border-2 border-primary opacity-10" />
        <span ref={inner} aria-hidden className="absolute h-28 w-28 rounded-full border-2 border-primary opacity-20" />
        <Mascot
          mood={mood}
          size={96}
          alt=""
          className={`relative z-10 transition-[opacity,filter] duration-300 ${dim ? "opacity-45 grayscale-[.5]" : ""}`}
        />
      </div>
      {caption && (
        <p aria-live="polite" className="text-sm text-text-muted">
          {caption}
        </p>
      )}
    </div>
  );
}
