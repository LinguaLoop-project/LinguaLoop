import { useEffect, useRef } from "react";

export type ShadowingTab = "watch" | "practice";

export interface ShadowingHotkeyHandlers {
  /** Space: bắt đầu hoặc dừng ghi âm. */
  toggleRecord: () => void;
  /** Nhả phím Ctrl (không kèm phím khác): nghe mẫu. */
  playModel: () => void;
  /** R: nghe lại giọng của mình. */
  playMine: () => void;
  /** C: nghe mẫu rồi nghe giọng mình. */
  compare: () => void;
  /** Alt+←. */
  prev: () => void;
  /** Alt+→. */
  next: () => void;
  /** Alt+W, Alt+P. */
  setTab: (tab: ShadowingTab) => void;
}

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
}

/**
 * Phím tắt của trang shadowing (khớp mockup v2). Phím không kèm Alt chỉ hoạt động ở tab Luyện và khi không
 * đang gõ vào ô nhập; Space nhường cho nút đang được focus (bấm nút bằng bàn phím).
 */
export function useShadowingHotkeys(handlers: ShadowingHotkeyHandlers, tab: ShadowingTab, enabled: boolean) {
  const latest = useRef({ handlers, tab, enabled });
  useEffect(() => {
    latest.current = { handlers, tab, enabled };
  });

  useEffect(() => {
    let ctrlDown = false;
    let ctrlOther = false;

    const onKeyDown = (e: KeyboardEvent) => {
      const { handlers: h, tab: currentTab, enabled: on } = latest.current;
      if (e.key === "Control") {
        ctrlDown = true;
        ctrlOther = false;
        return;
      }
      if (ctrlDown) ctrlOther = true;
      if (!on) return;

      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        h.prev();
        return;
      }
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        h.next();
        return;
      }
      if (e.altKey && (e.key === "w" || e.key === "W")) {
        e.preventDefault();
        h.setTab("watch");
        return;
      }
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        h.setTab("practice");
        return;
      }

      if (isTyping(document.activeElement) || e.ctrlKey || e.metaKey || e.altKey || currentTab !== "practice") return;
      if (e.code === "Space" && document.activeElement?.tagName !== "BUTTON") {
        e.preventDefault();
        h.toggleRecord();
      } else if (e.key === "r" || e.key === "R") {
        h.playMine();
      } else if (e.key === "c" || e.key === "C") {
        h.compare();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Control") return;
      const { handlers: h, tab: currentTab, enabled: on } = latest.current;
      if (ctrlDown && !ctrlOther && on && currentTab === "practice" && !isTyping(document.activeElement)) {
        h.playModel();
      }
      ctrlDown = false;
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
