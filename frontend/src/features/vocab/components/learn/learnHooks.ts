import { useEffect, useRef } from "react";
import { playPronunciation } from "@/features/dictionary";
import type { LearnCard } from "../../types";

/** Thời gian từ lúc thẻ hiện ra tới lúc trả lời; đặt lại mỗi khi `key` đổi. */
export function useCardClock(key: string) {
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, [key]);
  return () => Date.now() - startedAt.current;
}

/** Gọi `handler` mỗi khi nhấn phím; bỏ qua khi đang gõ trong ô nhập hoặc khi Enter, Space đã bấm một nút. */
export function useKeys(handler: (event: KeyboardEvent) => void, enabled = true) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Enter và Space trên nút hoặc liên kết đang được focus đã tự bấm nút đó rồi, không xử lý lần nữa.
      const pressable = target && (target.tagName === "BUTTON" || target.tagName === "A" || target.getAttribute("role") === "button");
      if (pressable && (event.key === "Enter" || event.key === " ")) return;
      latest.current(event);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** Phát âm giọng Mỹ của thẻ; thẻ không có âm thanh hoặc âm thanh lỗi thì dùng giọng đọc của trình duyệt. */
export const speak = (card: LearnCard) => playPronunciation(card.word, "us", card.audioUs);
