import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dictationApi } from "./api";
import type {
  AttemptResult,
  DictationLesson,
  DictationLevel,
  DictationSettings,
  PlaybackRate,
  SubmitAttemptBody,
} from "./types";

/**
 * Mặc định TanStack Query tạm dừng request khi trình duyệt báo offline, nên nút nộp quay mãi và màn tải bài rơi nhầm
 * vào lỗi máy chủ. `always` cho request chạy và thất bại ngay (NETWORK_ERROR) để giao diện báo mất mạng kèm nút Thử lại.
 */
const NETWORK_MODE = "always" as const;

export const dictationKeys = {
  lesson: (slug: string) => ["dictation", "lesson", slug] as const,
  prompt: (sentenceId: string, level: DictationLevel) => ["dictation", "prompt", sentenceId, level] as const,
};

/** Bài, danh sách câu và kết quả gần nhất của từng câu. */
export const useDictationLesson = (slug?: string) =>
  useQuery({
    queryKey: dictationKeys.lesson(slug ?? ""),
    queryFn: () => dictationApi.getLesson(slug!),
    enabled: !!slug,
    networkMode: NETWORK_MODE,
  });

/** Đề của một câu (Normal: độ dài từng từ). Đề không đổi theo thời gian nên không tải lại. */
export const useDictationPrompt = (sentenceId: string | undefined, level: DictationLevel, enabled: boolean) =>
  useQuery({
    queryKey: dictationKeys.prompt(sentenceId ?? "", level),
    queryFn: () => dictationApi.getPrompt(sentenceId!, level),
    enabled: enabled && !!sentenceId,
    staleTime: Infinity,
    networkMode: NETWORK_MODE,
  });

/** Nộp một lượt; thành công thì cập nhật kết quả gần nhất và chữ gốc của câu trong cache của bài. */
export const useSubmitAttempt = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ sentenceId, body }: { sentenceId: string; body: SubmitAttemptBody }) =>
      dictationApi.submitAttempt(sentenceId, body),
    onSuccess: (result: AttemptResult, { sentenceId, body }) => {
      queryClient.setQueryData<DictationLesson>(dictationKeys.lesson(slug), (lesson) =>
        lesson
          ? {
              ...lesson,
              sentences: lesson.sentences.map((s) =>
                s.id === sentenceId
                  ? {
                      ...s,
                      text: result.text,
                      textVi: result.textVi,
                      latest: {
                        attemptId: result.attemptId,
                        level: result.level,
                        score: result.score,
                        gaveUp: result.gaveUp,
                        retry: body.retry ?? false,
                        attemptedAt: new Date().toISOString(),
                      },
                    }
                  : s,
              ),
            }
          : lesson,
      );
    },
  });
};

const SETTINGS_KEY = "ll-dict-settings";
const RATES: PlaybackRate[] = [0.5, 0.75, 1];
const DEFAULT_SETTINGS: DictationSettings = {
  level: "normal",
  rate: 0.75,
  autoNext: false,
  showTranslation: true,
  hideVideo: false,
};

/** Đọc cài đặt đã lưu, bỏ qua giá trị lạ (vd mức Easy chưa hỗ trợ); localStorage bị chặn thì dùng mặc định. */
function readSettings(): DictationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<DictationSettings>;
    return {
      level: saved.level === "hard" ? "hard" : "normal",
      rate: RATES.includes(saved.rate as PlaybackRate) ? (saved.rate as PlaybackRate) : DEFAULT_SETTINGS.rate,
      autoNext: saved.autoNext === true,
      showTranslation: saved.showTranslation !== false,
      hideVideo: saved.hideVideo === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const useDictationSettings = () => {
  const [settings, setSettings] = useState<DictationSettings>(readSettings);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // không lưu được thì chỉ mất lựa chọn ở lần mở sau
    }
  }, [settings]);

  const update = useCallback((patch: Partial<DictationSettings>) => setSettings((prev) => ({ ...prev, ...patch })), []);
  return [settings, update] as const;
};

const subscribeOnline = (notify: () => void) => {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
};

/** Trình duyệt đang có mạng không (sự kiện online/offline). */
export const useOnlineStatus = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
