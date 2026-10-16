import Mascot, { type MascotMood } from "./Mascot";

/** Lời nhắn của Loopi cạnh tiêu đề trang (`.loopi-say` + `.bubble` trong mockup v2): mascot và bong bóng có mũi tên nhỏ. */
export default function LoopiSay({ mood, text, size = 56, className = "" }: { mood: MascotMood; text: string; size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Mascot mood={mood} size={size} alt="" className="animate-loopi-float" />
      <span className="relative inline-block rounded-md bg-primary-soft px-3.5 py-2.5 text-sm text-text before:absolute before:-left-1.5 before:top-1/2 before:-mt-1.5 before:h-3 before:w-3 before:rotate-45 before:rounded-[3px] before:bg-primary-soft before:content-['']">
        {text}
      </span>
    </div>
  );
}
