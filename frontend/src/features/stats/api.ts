import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import type {
  DictationErrors,
  HistoryMode,
  HistoryPage,
  PhonemeDetail,
  PracticeKind,
  PracticeSessionDetail,
  PronunciationOverview,
  StatsOverview,
  StatsRange,
  Streak,
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

  /** Lỗi Nghe chép theo đủ sáu nhóm từ (UC-TH-01). */
  getDictationErrors: (range: StatsRange) => get<DictationErrors>("/dictation-errors", { range }),

  /** Lịch sử luyện tập, 20 dòng mỗi trang; `page` từ 0 (UC-TH-02). */
  getHistory: (mode: HistoryMode, range: StatsRange, page: number) =>
    get<HistoryPage>("/history", { mode, range, page }),

  /** Từng lượt của một Buổi luyện; `day` là ngày lịch yyyy-MM-dd. */
  getPracticeSession: (lessonId: string, mode: PracticeKind, day: string) =>
    get<PracticeSessionDetail>(`/history/practice-sessions/${lessonId}`, { mode, day }),

  /** Điểm phát âm theo thời gian và Bản đồ 44 âm vị (UC-TH-03). */
  getPronunciation: (range: StatsRange) => get<PronunciationOverview>("/pronunciation", { range }),

  /** Chi tiết một âm vị; ký hiệu IPA đi qua query vì có ký tự như θ và ʃ. */
  getPhoneme: (symbol: string, range: StatsRange) => get<PhonemeDetail>("/pronunciation/phoneme", { symbol, range }),
};
