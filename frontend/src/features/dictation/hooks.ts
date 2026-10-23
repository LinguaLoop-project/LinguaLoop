import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { dictationApi } from "./api";
import type {
  AttemptResult,
  DictationLesson,
  DictationLevel,
  DictationSentence,
  DictationSettings,
  PlaybackRate,
  RevealWordBody,
  SubmitAttemptBody,
} from "./types";

/**
 * Mặc định TanStack Query tạm dừng request khi trình duyệt báo offline, nên nút nộp quay mãi và màn tải bài rơi nhầm
 * vào lỗi máy chủ. `always` cho request chạy và thất bại ngay (NETWORK_ERROR) để giao diện báo mất mạng kèm nút Thử lại.
 */
const NETWORK_MODE = "always" as const;

export const dictationKeys = {
  lesson: (slug: string) => ["dictation", "lesson", slug] as const,
  latest: (sentenceId: string) => ["dictation", "latest", sentenceId] as const,
  history: (sentenceId: string) => ["dictation", "history", sentenceId] as const,
  attempt: (sentenceId: string, attemptId: number) => ["dictation", "attempt", sentenceId, attemptId] as const,
  prompt: (sentenceId: string, level: DictationLevel, nonce: number) =>
    ["dictation", "prompt", sentenceId, level, nonce] as const,
};

/** Bài, danh sách câu và kết quả gần nhất của từng câu. */
export const useDictationLesson = (slug?: string) =>
  useQuery({
    queryKey: dictationKeys.lesson(slug ?? ""),
    queryFn: () => dictationApi.getLesson(slug!),
    enabled: !!slug,
    networkMode: NETWORK_MODE,
  });

/**
 * Đề của một câu (Normal: độ dài từng từ; Easy: câu kèm các ô trống). Đề Normal không đổi nên không tải lại.
 * Đề Easy backend khoét ngẫu nhiên mỗi lần gọi, nên mỗi lượt làm (`nonce`) có đề riêng và không được giữ lại cache.
 */
export const useDictationPrompt = (sentenceId: string | undefined, level: DictationLevel, enabled: boolean, nonce = 0) =>
  useQuery({
    queryKey: dictationKeys.prompt(sentenceId ?? "", level, level === "easy" ? nonce : 0),
    queryFn: () => dictationApi.getPrompt(sentenceId!, level),
    enabled: enabled && !!sentenceId,
    staleTime: Infinity,
    gcTime: level === "easy" ? 0 : undefined,
    retry: false,
    networkMode: NETWORK_MODE,
  });

/** Kết quả từng từ của lượt gần nhất, để mở lại câu đã làm (trang tải lại hoặc quay lại câu). */
export const useLatestAttempt = (sentenceId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: dictationKeys.latest(sentenceId ?? ""),
    queryFn: () => dictationApi.getLatestAttempt(sentenceId!),
    enabled: enabled && !!sentenceId,
    retry: false,
    networkMode: NETWORK_MODE,
  });

/** Lịch sử lượt làm của câu; chỉ tải khi bảng lịch sử đang mở. */
export const useAttemptHistory = (sentenceId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: dictationKeys.history(sentenceId ?? ""),
    queryFn: () => dictationApi.getAttemptHistory(sentenceId!),
    enabled: enabled && !!sentenceId,
    networkMode: NETWORK_MODE,
  });

/** Kết quả từng từ của một lượt trong lịch sử; lượt đã lưu không đổi nên không tải lại. */
export const useHistoryAttempt = (sentenceId: string | undefined, attemptId: number | null) =>
  useQuery({
    queryKey: dictationKeys.attempt(sentenceId ?? "", attemptId ?? 0),
    queryFn: () => dictationApi.getAttempt(sentenceId!, attemptId!),
    enabled: !!sentenceId && attemptId !== null,
    staleTime: Infinity,
    retry: false,
    networkMode: NETWORK_MODE,
  });

/** Cập nhật một câu trong cache của bài (ghi chú, trạng thái Câu cần ôn). */
function patchSentence(queryClient: QueryClient, slug: string, sentenceId: string, patch: Partial<DictationSentence>) {
  queryClient.setQueryData<DictationLesson>(dictationKeys.lesson(slug), (lesson) =>
    lesson
      ? { ...lesson, sentences: lesson.sentences.map((s) => (s.id === sentenceId ? { ...s, ...patch } : s)) }
      : lesson,
  );
}

/** Lưu ghi chú của câu (đã lưu thì thay nội dung). */
export const useSaveNote = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ sentenceId, content }: { sentenceId: string; content: string }) =>
      dictationApi.saveNote(sentenceId, content),
    onSuccess: (note) => patchSentence(queryClient, slug, note.sentenceId, { note: note.content }),
  });
};

export const useDeleteNote = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: (sentenceId: string) => dictationApi.deleteNote(sentenceId),
    onSuccess: (_data, sentenceId) => patchSentence(queryClient, slug, sentenceId, { note: null }),
  });
};

/** Ghim hoặc bỏ ghim một câu khỏi Câu cần ôn. */
export const useSetReview = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ sentenceId, pinned }: { sentenceId: string; pinned: boolean }) =>
      pinned ? dictationApi.pinReview(sentenceId) : dictationApi.resolveReview(sentenceId),
    onSuccess: (_data, { sentenceId, pinned }) => patchSentence(queryClient, slug, sentenceId, { inReview: pinned }),
  });
};

/** Xin lộ một từ. Không lưu gì ở backend và không đụng cache: từ đã lộ chỉ được tính khi nộp bài. */
export const useRevealWord = () =>
  useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ sentenceId, body }: { sentenceId: string; body: RevealWordBody }) =>
      dictationApi.revealWord(sentenceId, body),
  });

/** Nộp một lượt; thành công thì cập nhật kết quả gần nhất và chữ gốc của câu trong cache của bài. */
export const useSubmitAttempt = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ sentenceId, body }: { sentenceId: string; body: SubmitAttemptBody }) =>
      dictationApi.submitAttempt(sentenceId, body),
    onSuccess: (result: AttemptResult, { sentenceId, body }) => {
      queryClient.setQueryData<AttemptResult>(dictationKeys.latest(sentenceId), result);
      void queryClient.invalidateQueries({ queryKey: dictationKeys.history(sentenceId) });
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
      // Câu có vào Câu cần ôn hay không do backend quyết định (điểm dưới 60 thì thêm, từ 80 thì gỡ).
      void queryClient.invalidateQueries({ queryKey: dictationKeys.lesson(slug) });
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

/** Đọc cài đặt đã lưu, bỏ qua giá trị lạ; localStorage bị chặn thì dùng mặc định. */
function readSettings(): DictationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<DictationSettings>;
    return {
      level: saved.level === "easy" || saved.level === "hard" ? saved.level : "normal",
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
