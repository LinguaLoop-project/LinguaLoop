export type MascotMood = "hello" | "listening" | "speaking" | "correct" | "encourage" | "celebrate";

const ALT: Record<MascotMood, string> = {
  hello: "Loopi vẫy tay chào",
  listening: "Loopi đang nghe",
  speaking: "Loopi đang nói",
  correct: "Loopi vui vì bạn làm đúng",
  encourage: "Loopi động viên bạn",
  celebrate: "Loopi ăn mừng",
};

export interface MascotProps {
  mood?: MascotMood;
  size?: number;
  /** Mô tả thay thế; để chuỗi rỗng khi mascot chỉ trang trí cạnh đã có chữ. */
  alt?: string;
  className?: string;
}

/** Mascot Loopi (DESIGN.v2 §6.1). Tối đa một mascot lớn trên mỗi màn hình. */
export default function Mascot({ mood = "hello", size = 96, alt, className = "" }: MascotProps) {
  return (
    <img
      className={`select-none pointer-events-none ${className}`}
      src={`/mascot/loopi-${mood}.svg`}
      width={size}
      height={size}
      alt={alt ?? ALT[mood]}
      draggable={false}
    />
  );
}
