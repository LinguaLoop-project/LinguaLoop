/** Logo YouTube nhiều màu: nền đỏ #FF0000 bo góc, tam giác trắng. Dùng cho thẻ nguồn và nút nhập từ YouTube. */
export default function YouTubeLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
      <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
      <path d="m10 8.8 5.2 3.2-5.2 3.2z" fill="#fff" />
    </svg>
  );
}
