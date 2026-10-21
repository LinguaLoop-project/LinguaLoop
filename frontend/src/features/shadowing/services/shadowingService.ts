import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/lesson/types";
import type { AttemptResponse, LatestAttempt } from "../types";

export const shadowingService = {
  /** Gửi bản ghi WAV (16 kHz mono) của một câu đi chấm. */
  assess: async (sentenceId: string, wav: Blob): Promise<AttemptResponse> => {
    const form = new FormData();
    form.append("audio", wav, "recording.wav");
    const response = await axiosClient.post<ApiResponse<AttemptResponse>>(
      `/sentences/${sentenceId}/shadowing-attempts`,
      form,
    );
    return response.data.data;
  },

  getLatest: async (lessonSlug: string): Promise<LatestAttempt[]> => {
    const response = await axiosClient.get<ApiResponse<LatestAttempt[]>>(
      `/lessons/${lessonSlug}/shadowing-attempts/latest`,
    );
    return response.data.data;
  },
};
