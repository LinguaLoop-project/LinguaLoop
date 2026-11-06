import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shadowingService } from "../services/shadowingService";

export const useLatestAttempts = (slug?: string) =>
  useQuery({
    queryKey: ["shadowing", "latest", slug],
    queryFn: () => shadowingService.getLatest(slug!),
    enabled: !!slug,
    // Chỉ dùng để khôi phục lúc vào trang; sau đó trang tự giữ kết quả mới
    staleTime: Infinity,
    gcTime: 0,
  });

/** Lịch sử lượt đọc của một câu; chỉ tải khi bảng lịch sử đang mở. */
export const useAttemptHistory = (sentenceId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ["shadowing", "history", sentenceId],
    queryFn: () => shadowingService.getHistory(sentenceId!),
    enabled: enabled && !!sentenceId,
  });

/** Kết quả đầy đủ của một lượt cũ; lượt đã lưu không đổi nên không tải lại. */
export const useHistoryAttempt = (attemptId: number | null) =>
  useQuery({
    queryKey: ["shadowing", "attempt", attemptId],
    queryFn: () => shadowingService.getAttempt(attemptId!),
    enabled: attemptId !== null,
    staleTime: Infinity,
    retry: false,
  });

export const useAssessAttempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sentenceId, wav }: { sentenceId: string; wav: Blob }) => shadowingService.assess(sentenceId, wav),
    onSuccess: () => {
      // Lượt mới vào lịch sử, và có thể đã thêm hoặc gỡ câu ở Câu cần ôn
      void queryClient.invalidateQueries({ queryKey: ["shadowing", "history"] });
      void queryClient.invalidateQueries({ queryKey: ["practice"] });
      // Tiến độ bài học (trang chi tiết, thư viện) đã đổi sau lượt này: đánh dấu cũ để lần mở sau tải lại
      for (const key of ["detail", "overview", "search"]) {
        void queryClient.invalidateQueries({ queryKey: ["lessons", key], exact: false });
      }
    },
  });
};
