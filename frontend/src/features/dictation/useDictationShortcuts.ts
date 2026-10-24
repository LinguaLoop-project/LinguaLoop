import { useEffect, useRef } from "react";
import type { DictationLevel } from "./types";

export interface ShortcutHandlers {
  /** Nhả Ctrl (không kèm phím khác): phát hoặc dừng câu hiện tại. */
  onPlay: () => void;
  /** Enter ở màn kết quả: sang câu tiếp. */
  onNext: () => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
  onLevel: (level: DictationLevel) => void;
  /** Phím N: mở hoặc đóng ô ghi chú của câu. */
  onNote: () => void;
  mode: "work" | "review";
}

const LEVEL_BY_DIGIT: Record<string, DictationLevel> = { Digit1: "easy", Digit2: "normal", Digit3: "hard", Numpad1: "easy", Numpad2: "normal", Numpad3: "hard" };

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && ["TEXTAREA", "INPUT", "SELECT"].includes(target.tagName);

/**
 * Phím tắt toàn trang (spec G4). Enter để nộp bài do chính ô nhập xử lý (`FullInput`), ở đây chỉ có Enter
 * sang câu tiếp khi đang xem kết quả. Dùng ref để luôn gọi hàm mới nhất mà không phải gắn lại sự kiện.
 */
export function useDictationShortcuts(handlers: ShortcutHandlers) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    let ctrlDown = false;
    let ctrlUsed = false;

    const onKeyDown = (event: KeyboardEvent) => {
      const h = latest.current;
      if (event.key === "Control") {
        if (!event.repeat) {
          ctrlDown = true;
          ctrlUsed = false;
        }
        return;
      }
      if (ctrlDown) ctrlUsed = true;

      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        h.onPrevSentence();
      } else if (event.altKey && event.key === "ArrowRight") {
        event.preventDefault();
        h.onNextSentence();
      } else if (event.altKey && LEVEL_BY_DIGIT[event.code]) {
        event.preventDefault();
        h.onLevel(LEVEL_BY_DIGIT[event.code]);
      } else if (
        event.code === "KeyN" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        h.onNote();
      } else if (
        event.key === "Enter" &&
        !event.shiftKey &&
        h.mode === "review" &&
        !isTypingTarget(event.target) &&
        !(event.target instanceof HTMLButtonElement) &&
        !(event.target instanceof HTMLAnchorElement)
      ) {
        event.preventDefault();
        h.onNext();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== "Control") return;
      if (ctrlDown && !ctrlUsed) latest.current.onPlay();
      ctrlDown = false;
    };

    const resetCtrl = () => {
      ctrlDown = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", resetCtrl);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", resetCtrl);
    };
  }, []);
}
