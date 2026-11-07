import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { practiceApi } from "./api";
import type { PracticeMode, ReviewReason } from "./types";

const NETWORK_MODE = "always" as const;

export const practiceKeys = {
  review: (mode?: PracticeMode, lessonSlug?: string) => ["practice", "review", mode ?? "all", lessonSlug ?? "all"] as const,
  notes: (lessonSlug?: string) => ["practice", "notes", lessonSlug ?? "all"] as const,
};

/**
 * Sau khi đổi Câu cần ôn hoặc ghi chú: làm mới mọi danh sách dùng chung và cache của màn nghe chép, nơi mỗi câu mang
 * cờ `inReview` và `note`.
 */
export const refreshPractice = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["practice"] }),
    queryClient.invalidateQueries({ queryKey: ["dictation", "lesson"] }),
  ]);

/** Câu đang cần ôn; bỏ `mode` để lấy cả hai chế độ, `lessonSlug` để chỉ lấy một bài. */
export const useReviewEntries = (mode?: PracticeMode, lessonSlug?: string, enabled = true) =>
  useQuery({
    queryKey: practiceKeys.review(mode, lessonSlug),
    queryFn: () => practiceApi.listReview(mode, lessonSlug),
    enabled,
    networkMode: NETWORK_MODE,
  });

export const useNoteEntries = (lessonSlug?: string, enabled = true) =>
  useQuery({
    queryKey: practiceKeys.notes(lessonSlug),
    queryFn: () => practiceApi.listNotes(lessonSlug),
    enabled,
    networkMode: NETWORK_MODE,
  });

/** Ghim hoặc bỏ ghim một câu ở Câu cần ôn của chế độ; làm mới các danh sách khi xong. */
export const useSetReview = (mode: PracticeMode) => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ sentenceId, pinned, reason }: { sentenceId: string; pinned: boolean; reason?: ReviewReason }) =>
      pinned ? practiceApi.pinReview(mode, sentenceId, reason) : practiceApi.resolveReview(mode, sentenceId),
    onSuccess: () => refreshPractice(queryClient),
  });
};

export const useSaveNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ sentenceId, content }: { sentenceId: string; content: string }) =>
      practiceApi.saveNote(sentenceId, content),
    onSuccess: () => refreshPractice(queryClient),
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: (sentenceId: string) => practiceApi.deleteNote(sentenceId),
    onSuccess: () => refreshPractice(queryClient),
  });
};
