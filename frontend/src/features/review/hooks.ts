import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PracticeMode } from "@/features/practice/types";
import { reviewApi } from "./api";

/**
 * Mặc định TanStack Query tạm dừng request khi trình duyệt báo offline; `always` cho request chạy và thất bại ngay để
 * giao diện báo mất mạng kèm nút Thử lại.
 */
const NETWORK_MODE = "always" as const;

/** Cuộn về đầu trang mỗi khi `key` đổi (sang câu, chặng hoặc màn tổng kết mới), nếu không bước mới mở ra ở giữa trang. */
export function useScrollTopOn(key: string | number): void {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [key]);
}

export const reviewKeys = {
  dailyPlan: (run: number) => ["review", "daily-plan", run] as const,
  dailyCards: (run: number, extra: boolean) => ["review", "daily-cards", run, extra] as const,
  sentencePlan: (perMode: number, run: number, sentenceId?: string, mode?: PracticeMode) =>
    ["review", "sentence-plan", perMode, run, sentenceId ?? "all", mode ?? "all"] as const,
};

/**
 * Kế hoạch Ôn tập hằng ngày. `run` tăng mỗi lần học viên chọn "Ôn tiếp" để lập lại từ dữ liệu hiện tại. Luôn tải mới vì
 * thẻ và câu đổi sau mỗi lượt ôn.
 */
export const useDailyPlan = (run: number, enabled = true) =>
  useQuery({
    queryKey: reviewKeys.dailyPlan(run),
    queryFn: reviewApi.getDailyPlan,
    enabled,
    networkMode: NETWORK_MODE,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  });

/**
 * Thẻ của phần ôn thẻ (đến hạn, từ mới, thẻ củng cố). Không tự tải lại để danh sách thẻ không đổi giữa lượt; `run` tăng khi
 * "Ôn tiếp".
 */
export const useDailyCards = (run: number, extra: boolean) =>
  useQuery({
    queryKey: reviewKeys.dailyCards(run, extra),
    queryFn: () => reviewApi.getDailyCards(extra),
    networkMode: NETWORK_MODE,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/**
 * Số thẻ còn đến hạn khi kết thúc phiên, để quyết định có hiện "Ôn tiếp" (BR-HT-24). Dùng khoá riêng để không làm đổi
 * kế hoạch của phiên đang chạy.
 */
export const useRemainingPlan = (run: number, enabled: boolean) =>
  useQuery({
    queryKey: ["review", "daily-plan", "after", run] as const,
    queryFn: reviewApi.getDailyPlan,
    enabled,
    networkMode: NETWORK_MODE,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  });

/** Các câu của phiên Ôn câu riêng; `run` tăng khi "Ôn thêm". Không tự tải lại để danh sách không đổi giữa chừng. */
export const useSentencePlan = (perMode: number, run: number, sentenceId?: string, mode?: PracticeMode) =>
  useQuery({
    queryKey: reviewKeys.sentencePlan(perMode, run, sentenceId, mode),
    queryFn: () => reviewApi.getSentencePlan(perMode, sentenceId, mode),
    networkMode: NETWORK_MODE,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/** Hoãn câu sang ngày mai khi học viên bỏ qua; làm mới các danh sách và kế hoạch khi xong (BR-HT-21). */
export const useSkipSentence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ mode, sentenceId }: { mode: PracticeMode; sentenceId: string }) => reviewApi.skipSentence(mode, sentenceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["practice"] });
    },
  });
};

/** Đánh dấu câu đã ôn; làm mới các danh sách Câu cần ôn và kế hoạch khi xong. */
export const useMarkReviewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: NETWORK_MODE,
    mutationFn: ({ mode, sentenceId }: { mode: PracticeMode; sentenceId: string }) => reviewApi.markReviewed(mode, sentenceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["practice"] });
    },
  });
};
