import { useCallback, useState } from "react";
import { useAuthStore } from "@/features/auth/stores/authStore";
import * as api from "../api";
import type { LessonEvent } from "../types";

/** ask = chưa trả lời câu hỏi bật gia sư của bài này; on/off = lựa chọn đã nhớ. */
export type TutorMode = "ask" | "on" | "off";

/** Theo cả người dùng: máy dùng chung không được thừa hưởng lựa chọn của người trước. */
export const storageKey = (userId: string, lessonId: string) => `ll-tutor-${userId}-${lessonId}`;

export function parseMode(raw: string | null): TutorMode {
  return raw === "on" || raw === "off" ? raw : "ask";
}

function read(userId: string, lessonId: string): TutorMode {
  try {
    return parseMode(localStorage.getItem(storageKey(userId, lessonId)));
  } catch {
    return "ask"; // chế độ riêng tư hoặc bị chặn lưu trữ: hỏi lại mỗi lần mở bài
  }
}

/**
 * Chế độ gia sư của một bài, nhớ theo từng bài trên trình duyệt (server không lưu cài đặt này). Mỗi lần người học
 * chọn đều ghi một sự kiện để đo tỉ lệ bật gia sư; lỗi ghi sự kiện không ảnh hưởng người học.
 */
export function useTutorMode(lessonId: string) {
  const userId = useAuthStore((s) => s.user?.id ?? "anonymous");
  const [mode, setMode] = useState<TutorMode>(() => read(userId, lessonId));

  const choose = useCallback(
    (on: boolean, event: LessonEvent) => {
      setMode(on ? "on" : "off");
      try {
        localStorage.setItem(storageKey(userId, lessonId), on ? "on" : "off");
      } catch {
        // không lưu được thì chỉ giữ trong phiên làm việc này
      }
      api.sendLessonEvent(lessonId, event).catch((err) => console.warn("lesson event failed", err));
    },
    [userId, lessonId],
  );

  return {
    mode,
    /** Trả lời câu hỏi bật gia sư đầu bài. */
    answer: (on: boolean) => choose(on, on ? "start_on" : "start_off"),
    /** Bật hoặc tắt bằng công tắc giữa bài. */
    toggle: (on: boolean) => choose(on, on ? "toggle_on" : "toggle_off"),
  };
}
