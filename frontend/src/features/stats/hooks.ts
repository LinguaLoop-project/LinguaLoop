import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { statsApi } from "./api";
import type { HistoryMode, PracticeKind, StatsRange } from "./types";

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
    queryFn: () => statsApi.getHistory(mode, range, page),
    placeholderData: keepPreviousData,
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
