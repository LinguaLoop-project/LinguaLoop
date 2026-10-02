// Mascot Loopi — LinguaLoop
// Chép thư mục svg/ vào public/mascot/ rồi dùng:
//   <Mascot mood="hello" />
//   <Mascot mood="correct" size={96} />
//   <Mascot mood="encourage" message="Không sao, nghe lại câu này nhé!" />

type Mood = "hello" | "listening" | "speaking" | "correct" | "encourage" | "celebrate";

type MascotProps = {
  mood?: Mood;
  size?: number;        // px, mặc định 160
  message?: string;     // bong bóng lời thoại bên cạnh (tuỳ chọn)
  className?: string;
};

const ALT: Record<Mood, string> = {
  hello: "Loopi vẫy tay chào",
  listening: "Loopi đang nghe",
  speaking: "Loopi đang nói",
  correct: "Loopi vui vì bạn trả lời đúng",
  encourage: "Loopi động viên bạn thử lại",
  celebrate: "Loopi ăn mừng",
};

export default function Mascot({ mood = "hello", size = 160, message, className = "" }: MascotProps) {
  return (
    <div className={`loopi loopi--${mood} ${className}`}>
      {/* key={mood} để animation vào chạy lại mỗi khi đổi trạng thái */}
      <img
        key={mood}
        src={`/mascot/loopi-${mood}.svg`}
        width={size}
        height={size}
        alt={message ? "" : ALT[mood]}
        className="loopi__img"
        draggable={false}
      />
      {message && (
        <p className="loopi__bubble" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

/* ---- Thêm vào CSS toàn cục (globals.css) ----

.loopi { display: inline-flex; align-items: center; gap: 12px; }
.loopi__img { display: block; user-select: none; }

.loopi__bubble {
  margin: 0; max-width: 260px; padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  background: var(--surface-glass); border: 1px solid var(--border-strong);
  backdrop-filter: blur(12px);
  color: var(--text); font-size: 14px; line-height: 1.5;
  animation: loopi-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both 120ms;
}

.loopi__img { animation: loopi-float 4s ease-in-out infinite; }

.loopi--hello .loopi__img     { animation: loopi-pop 450ms cubic-bezier(0.34,1.56,0.64,1), loopi-float 4s ease-in-out 450ms infinite; }
.loopi--correct .loopi__img   { animation: loopi-jump 500ms cubic-bezier(0.34,1.56,0.64,1), loopi-float 4s ease-in-out 500ms infinite; }
.loopi--encourage .loopi__img { animation: loopi-shake 400ms ease-in-out, loopi-float 4s ease-in-out 400ms infinite; }
.loopi--celebrate .loopi__img { animation: loopi-spin 700ms cubic-bezier(0.22,1,0.36,1), loopi-float 3s ease-in-out 700ms infinite; }
.loopi--listening .loopi__img,
.loopi--speaking .loopi__img  { animation: loopi-groove 1.2s ease-in-out infinite; }

@keyframes loopi-float  { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
@keyframes loopi-pop    { from { transform: scale(0.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
@keyframes loopi-jump   { 0% { transform: translateY(0) } 40% { transform: translateY(-24px) scale(1.05) } 100% { transform: translateY(0) } }
@keyframes loopi-shake  { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) rotate(-3deg) } 75% { transform: translateX(6px) rotate(3deg) } }
@keyframes loopi-spin   { from { transform: scale(0.8) rotate(-20deg) } to { transform: scale(1) rotate(0) } }
@keyframes loopi-groove { 0%,100% { transform: rotate(-3deg) } 50% { transform: rotate(3deg) translateY(-3px) } }

@media (prefers-reduced-motion: reduce) {
  .loopi__img, .loopi__bubble { animation: none !important; }
}

*/
