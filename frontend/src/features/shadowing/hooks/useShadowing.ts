import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USAGE_QUERY_KEY } from "@/features/subscription/hooks/useUsage";
import type { UsageResponse } from "@/features/subscription/types";
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

export const useAssessAttempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sentenceId, wav }: { sentenceId: string; wav: Blob }) => shadowingService.assess(sentenceId, wav),
    onSuccess: (result) => {
      // Phản hồi đã kèm số lượt mới: cập nhật thẳng thay vì gọi lại /me/usage
      // Tiến độ bài học (trang chi tiết, thư viện) đã đổi sau lượt này: đánh dấu cũ để lần mở sau tải lại
      for (const key of ["detail", "overview", "search"]) {
        void queryClient.invalidateQueries({ queryKey: ["lessons", key], exact: false });
      }
      queryClient.setQueryData<UsageResponse>(USAGE_QUERY_KEY, (old) =>
        old ? { features: old.features.map((f) => (f.feature === result.usage.feature ? result.usage : f)) } : old,
      );
    },
    onError: () => {
      // Hết lượt hoặc đã được hoàn lượt: đọc lại cho đúng
      void queryClient.invalidateQueries({ queryKey: USAGE_QUERY_KEY });
    },
  });
};
