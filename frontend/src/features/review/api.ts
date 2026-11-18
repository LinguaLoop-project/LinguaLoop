import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import type { PracticeMode } from "@/features/practice/types";
import type { DailyPlan, PlanSentence } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

export const reviewApi = {
  /** Kế hoạch Ôn tập hằng ngày: định mức theo mục tiêu ngày, số thẻ đến hạn và các câu được chọn (UC-HT-05). */
  getDailyPlan: async (): Promise<DailyPlan> => {
    const response = await axiosClient.get<ApiResponse<DailyPlan>>("/review/daily-plan", { timeout: REQUEST_TIMEOUT_MS });
    return response.data.data;
  },

  /** Các câu của phiên Ôn câu riêng: mỗi chế độ tối đa `perMode` câu, loại câu đã ôn hôm nay (BR-HT-20). */
  getSentencePlan: async (perMode = 2): Promise<PlanSentence[]> => {
    const response = await axiosClient.get<ApiResponse<PlanSentence[]>>("/review/sentence-plan", {
      params: { perMode },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },

  /** Hoãn câu sang ngày mai khi học viên bỏ qua: không chọn lại hôm nay và không tính là đã ôn (BR-HT-21). */
  skipSentence: async (mode: PracticeMode, sentenceId: string): Promise<void> => {
    await axiosClient.post(`/review/${mode}/sentences/${sentenceId}/skipped`, undefined, { timeout: REQUEST_TIMEOUT_MS });
  },

  /** Đánh dấu câu "đã ôn hôm nay" sau một lượt đã lưu và chấm xong (BR-HT-21). */
  markReviewed: async (mode: PracticeMode, sentenceId: string): Promise<void> => {
    await axiosClient.post(`/review/${mode}/sentences/${sentenceId}/reviewed`, undefined, { timeout: REQUEST_TIMEOUT_MS });
  },
};
