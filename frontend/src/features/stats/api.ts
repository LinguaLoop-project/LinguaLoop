import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import { toAdminApiError } from "@/features/user";
import type {
  ActivityMap,
  AiUsageStats,
  DictationErrors,
  HistoryMode,
  HistoryPage,
  OverviewStats,
  PhonemeDetail,
  PlanFilter,
  PracticeKind,
  PracticeSessionDetail,
  PracticeStats,
  PronunciationOverview,
  StatsOverview,
  StatsPeriod,
  StatsRange,
  Streak,
  WrongWords,
} from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

const get = async <T>(path: string, params?: Record<string, string | number>): Promise<T> => {
  const response = await axiosClient.get<ApiResponse<T>>(`/stats${path}`, { params, timeout: REQUEST_TIMEOUT_MS });
  return response.data.data;
};

export const statsApi = {
  /** Tổng quan học tập: chuỗi, số câu, bài, thẻ và tỷ lệ đúng (UC-TH-01). */
  getOverview: (range: StatsRange) => get<StatsOverview>("/overview", { range }),

  /** Chỉ chuỗi ngày học, cho chip ở thanh trên cùng. */
  getStreak: () => get<Streak>("/streak"),

  /** Lịch nhiệt 90 ngày gần nhất (UC-TH-01). */
  getActivity: () => get<ActivityMap>("/activity"),

  /** Mười từ nghe sai nhiều nhất (UC-TH-01). */
  getWrongWords: (range: StatsRange) => get<WrongWords>("/dictation-errors/words", { range }),

  /** Lỗi Nghe chép theo đủ sáu nhóm từ (UC-TH-01). */
  getDictationErrors: (range: StatsRange) => get<DictationErrors>("/dictation-errors", { range }),

  /** Lịch sử luyện tập; `page` từ 0, `days` (tùy chọn) để phân trang theo số ngày gần nhất (UC-TH-02). */
  getHistory: (mode: HistoryMode, range: StatsRange, page: number, days?: number) =>
    get<HistoryPage>("/history", days !== undefined ? { mode, range, page, days } : { mode, range, page }),

  /** Từng lượt của một Buổi luyện; `day` là ngày lịch yyyy-MM-dd. */
  getPracticeSession: (lessonId: string, mode: PracticeKind, day: string) =>
    get<PracticeSessionDetail>(`/history/practice-sessions/${lessonId}`, { mode, day }),

  /** Điểm phát âm theo thời gian và Bản đồ 44 âm vị (UC-TH-03). */
  getPronunciation: (range: StatsRange) => get<PronunciationOverview>("/pronunciation", { range }),

  /** Chi tiết một âm vị; ký hiệu IPA đi qua query vì có ký tự như θ và ʃ. */
  getPhoneme: (symbol: string, range: StatsRange) => get<PhonemeDetail>("/pronunciation/phoneme", { symbol, range }),
};

const STATS = "/admin/stats";
const ADMIN_TIMEOUT_MS = 20_000;

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

/** Thống kê hệ thống của quản trị viên (UC-NK-02 đến 04). Lỗi ném ra là `AdminApiError`. */
export const adminStatsApi = {
  overview: (period: StatsPeriod) =>
    call<OverviewStats>(axiosClient.get(`${STATS}/overview`, { params: { period }, timeout: ADMIN_TIMEOUT_MS })),
  practice: (period: StatsPeriod, plan: PlanFilter) =>
    call<PracticeStats>(
      axiosClient.get(`${STATS}/practice`, { params: { period, plan }, timeout: ADMIN_TIMEOUT_MS }),
    ),
  aiUsage: (period: StatsPeriod) =>
    call<AiUsageStats>(axiosClient.get(`${STATS}/ai-usage`, { params: { period }, timeout: ADMIN_TIMEOUT_MS })),
};
