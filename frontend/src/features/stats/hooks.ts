import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminStatsApi, statsApi, teacherStatsApi } from "./api";
import type { HistoryMode, PlanFilter, PracticeKind, StatsPeriod, StatsRange } from "./types";
import { HISTORY_DAYS_PER_PAGE } from "./utils";

/**
 * Mặc định TanStack Query tạm dừng request khi trình duyệt báo offline; `always` cho request chạy và thất bại ngay để
 * giao diện báo mất mạng kèm nút Thử lại (AC-TH-07).
 */
const NETWORK_MODE = "always" as const;

/** Số liệu đổi theo từng lượt luyện nên không giữ cũ lâu; đổi khoảng thì giữ số cũ trong lúc tải để không nháy trang. */
const STALE_MS = 30_000;

export const statsKeys = {
  all: ["stats"] as const,
  overview: (range: StatsRange) => ["stats", "overview", range] as const,
  streak: ["stats", "streak"] as const,
  activity: ["stats", "activity"] as const,
  wrongWords: (range: StatsRange) => ["stats", "wrong-words", range] as const,
  dictationErrors: (range: StatsRange) => ["stats", "dictation-errors", range] as const,
  history: (mode: HistoryMode, range: StatsRange, page: number) => ["stats", "history", mode, range, page] as const,
  practiceSession: (lessonId: string, mode: PracticeKind, day: string) =>
    ["stats", "practice-session", lessonId, mode, day] as const,
  pronunciation: (range: StatsRange) => ["stats", "pronunciation", range] as const,
  phoneme: (symbol: string, range: StatsRange) => ["stats", "phoneme", symbol, range] as const,
};

const base = { networkMode: NETWORK_MODE, staleTime: STALE_MS, refetchOnWindowFocus: false, retry: 1 } as const;

export const useStatsOverview = (range: StatsRange) =>
  useQuery({
    ...base,
    queryKey: statsKeys.overview(range),
    queryFn: () => statsApi.getOverview(range),
    placeholderData: keepPreviousData,
  });

/** Chuỗi ngày học cho chip ở thanh trên cùng; chỉ tải khi `enabled` (học viên đã đăng nhập). */
export const useStreak = (enabled = true) =>
  useQuery({ ...base, queryKey: statsKeys.streak, queryFn: statsApi.getStreak, enabled });

/** Lịch nhiệt 13 tuần, không phụ thuộc bộ lọc khoảng. */
export const useActivity = () => useQuery({ ...base, queryKey: statsKeys.activity, queryFn: statsApi.getActivity });

export const useWrongWords = (range: StatsRange) =>
  useQuery({
    ...base,
    queryKey: statsKeys.wrongWords(range),
    queryFn: () => statsApi.getWrongWords(range),
    placeholderData: keepPreviousData,
  });

export const useDictationErrors = (range: StatsRange) =>
  useQuery({
    ...base,
    queryKey: statsKeys.dictationErrors(range),
    queryFn: () => statsApi.getDictationErrors(range),
    placeholderData: keepPreviousData,
  });

export const useHistory = (mode: HistoryMode, range: StatsRange, page: number) =>
  useQuery({
    ...base,
    queryKey: statsKeys.history(mode, range, page),
    queryFn: () => statsApi.getHistory(mode, range, page, HISTORY_DAYS_PER_PAGE),
    // Chỉ giữ dữ liệu trang trước khi chuyển trang trong CÙNG chế độ (mode) và khoảng (range);
    // khi đổi mode (vd: Tất cả -> Nghe chép), phải xóa ngay dữ liệu cũ để không hiện nhầm dòng Từ vựng.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === mode && previousQuery?.queryKey[3] === range ? previousData : undefined,
  });

/** Các lượt của một Buổi luyện; chỉ tải khi học viên mở dòng đó. */
export const usePracticeSession = (lessonId: string | null, mode: PracticeKind, day: string | null, enabled: boolean) =>
  useQuery({
    ...base,
    queryKey: statsKeys.practiceSession(lessonId ?? "", mode, day ?? ""),
    queryFn: () => statsApi.getPracticeSession(lessonId ?? "", mode, day ?? ""),
    enabled: enabled && lessonId !== null && day !== null,
  });

export const usePronunciation = (range: StatsRange) =>
  useQuery({
    ...base,
    queryKey: statsKeys.pronunciation(range),
    queryFn: () => statsApi.getPronunciation(range),
    placeholderData: keepPreviousData,
  });

export const usePhoneme = (symbol: string | null, range: StatsRange) =>
  useQuery({
    ...base,
    queryKey: statsKeys.phoneme(symbol ?? "", range),
    queryFn: () => statsApi.getPhoneme(symbol ?? "", range),
    enabled: symbol !== null,
    placeholderData: keepPreviousData,
  });

// ---------------------------------------------------------------- thống kê hệ thống của quản trị viên (UC-NK-02 đến 04)

const STATS_KEY = ["admin", "stats"] as const;

/**
 * Backend tính lại mỗi giờ (BR-NK-10) nên phía trình duyệt giữ 5 phút là đủ; đổi bộ lọc thì giữ số liệu cũ (mờ) cho
 * tới khi số liệu mới về, không nháy khung.
 */
const COMMON = { staleTime: 5 * 60_000, placeholderData: keepPreviousData, retry: false } as const;

export function useOverviewStats(period: StatsPeriod) {
  return useQuery({ queryKey: [...STATS_KEY, "overview", period], queryFn: () => adminStatsApi.overview(period), ...COMMON });
}

export function usePracticeStats(period: StatsPeriod, plan: PlanFilter) {
  return useQuery({
    queryKey: [...STATS_KEY, "practice", period, plan],
    queryFn: () => adminStatsApi.practice(period, plan),
    ...COMMON,
  });
}

export function useAiUsageStats(period: StatsPeriod) {
  return useQuery({ queryKey: [...STATS_KEY, "ai-usage", period], queryFn: () => adminStatsApi.aiUsage(period), ...COMMON });
}

// ---------------------------------------------------------------- thống kê nội dung của giáo viên (UC-TN-01 đến 03)

const TEACHER_STATS_KEY = ["teacher", "stats"] as const;

/** Backend tính lại mỗi giờ (BR-TN-06); `always` để mất mạng báo lỗi ngay kèm nút Tải lại (AC-TN-08). */
const TEACHER_COMMON = { ...COMMON, networkMode: NETWORK_MODE } as const;

export function useTeacherOverviewStats(period: StatsPeriod) {
  return useQuery({
    queryKey: [...TEACHER_STATS_KEY, "overview", period],
    queryFn: () => teacherStatsApi.overview(period),
    ...TEACHER_COMMON,
  });
}

export function useTeacherLessonStats(lessonId: string, period: StatsPeriod) {
  return useQuery({
    queryKey: [...TEACHER_STATS_KEY, "lesson", lessonId, period],
    queryFn: () => teacherStatsApi.lesson(lessonId, period),
    ...TEACHER_COMMON,
    enabled: lessonId !== "",
  });
}

export function useTeacherDeckStats(deckId: string, period: StatsPeriod) {
  return useQuery({
    queryKey: [...TEACHER_STATS_KEY, "deck", deckId, period],
    queryFn: () => teacherStatsApi.deck(deckId, period),
    ...TEACHER_COMMON,
    enabled: deckId !== "",
  });
}
