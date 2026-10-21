import { useCallback, useState } from "react";
import * as api from "../api";
import type { LessonEvent } from "../types";

/** ask = chưa trả lời câu hỏi bật gia sư của bài này; on/off = lựa chọn đã nhớ. */
export type TutorMode = "ask" | "on" | "off";

const storageKey = (lessonId: string) => `ll-tutor-${lessonId}`;

export function parseMode(raw: string | null): TutorMode {
  return raw === "on" || raw === "off" ? raw : "ask";
}

function read(lessonId: string): TutorMode {
  try {
    return parseMode(localStorage.getItem(storageKey(lessonId)));
  } catch {
    return "ask"; // chế độ riêng tư hoặc bị chặn lưu trữ: hỏi lại mỗi lần mở bài
  }
}

/**
 * Chế độ gia sư của một bài, nhớ theo từng bài trên trình duyệt (server không lưu cài đặt này). Mỗi lần người học
 * chọn đều ghi một sự kiện để đo tỉ lệ bật gia sư; lỗi ghi sự kiện không ảnh hưởng người học.
 */
export function useTutorMode(lessonId: string) {
  const [mode, setMode] = useState<TutorMode>(() => read(lessonId));

  const choose = useCallback(
    (on: boolean, event: LessonEvent) => {
      setMode(on ? "on" : "off");
      try {
        localStorage.setItem(storageKey(lessonId), on ? "on" : "off");
      } catch {
        // không lưu được thì chỉ giữ trong phiên làm việc này
      }
      api.sendLessonEvent(lessonId, event).catch((err) => console.warn("lesson event failed", err));
    },
    [lessonId],
  );

  return {
    mode,
    /** Trả lời câu hỏi bật gia sư đầu bài. */
    answer: (on: boolean) => choose(on, on ? "start_on" : "start_off"),
    /** Bật hoặc tắt bằng công tắc giữa bài. */
    toggle: (on: boolean) => choose(on, on ? "toggle_on" : "toggle_off"),
  };
}
