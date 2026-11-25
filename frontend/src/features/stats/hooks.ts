import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { statsApi } from "./api";
import type { PlanFilter, StatsPeriod } from "./types";

const STATS_KEY = ["admin", "stats"] as const;

/**
 * Backend tính lại mỗi giờ (BR-NK-10) nên phía trình duyệt giữ 5 phút là đủ; đổi bộ lọc thì giữ số liệu cũ (mờ) cho
 * tới khi số liệu mới về, không nháy khung.
 */
const COMMON = { staleTime: 5 * 60_000, placeholderData: keepPreviousData, retry: false } as const;

export function useOverviewStats(period: StatsPeriod) {
  return useQuery({ queryKey: [...STATS_KEY, "overview", period], queryFn: () => statsApi.overview(period), ...COMMON });
}

export function usePracticeStats(period: StatsPeriod, plan: PlanFilter) {
  return useQuery({
    queryKey: [...STATS_KEY, "practice", period, plan],
    queryFn: () => statsApi.practice(period, plan),
    ...COMMON,
  });
}

export function useAiUsageStats(period: StatsPeriod) {
  return useQuery({ queryKey: [...STATS_KEY, "ai-usage", period], queryFn: () => statsApi.aiUsage(period), ...COMMON });
}
