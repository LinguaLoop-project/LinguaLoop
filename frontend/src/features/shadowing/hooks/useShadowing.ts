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

export const useAssessAttempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sentenceId, wav }: { sentenceId: string; wav: Blob }) => shadowingService.assess(sentenceId, wav),
    onSuccess: () => {
      // Tiến độ bài học (trang chi tiết, thư viện) đã đổi sau lượt này: đánh dấu cũ để lần mở sau tải lại
      for (const key of ["detail", "overview", "search"]) {
        void queryClient.invalidateQueries({ queryKey: ["lessons", key], exact: false });
      }
    },
  });
};
