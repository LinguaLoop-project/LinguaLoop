import { useCallback, useState } from "react";
import { useAuthStore } from "@/features/auth/stores/authStore";

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

/** Chế độ gia sư của một bài, nhớ theo từng bài trên trình duyệt (server không lưu cài đặt này). */
export function useTutorMode(lessonId: string) {
  const userId = useAuthStore((s) => s.user?.id ?? "anonymous");
  const [mode, setMode] = useState<TutorMode>(() => read(userId, lessonId));

  const choose = useCallback(
    (on: boolean) => {
      setMode(on ? "on" : "off");
      try {
        localStorage.setItem(storageKey(userId, lessonId), on ? "on" : "off");
      } catch {
        // không lưu được thì chỉ giữ trong phiên làm việc này
      }
    },
    [userId, lessonId],
  );

  return {
    mode,
    /** Trả lời câu hỏi bật gia sư đầu bài. */
    answer: (on: boolean) => choose(on),
    /** Bật hoặc tắt bằng công tắc giữa bài. */
    toggle: (on: boolean) => choose(on),
  };
}
