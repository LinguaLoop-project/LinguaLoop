import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/auth";
import type { LikeState, WatchFeedPage } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

export const watchApi = {
  /** Một trang của luồng; cùng `seed` thì cùng thứ tự, `start` là bài đứng đầu luồng. */
  getFeed: async (seed: string, page: number, start?: string): Promise<WatchFeedPage> => {
    const response = await axiosClient.get<ApiResponse<WatchFeedPage>>("/watch/feed", {
      params: { seed, page, start },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.data.data;
  },

  setLiked: async (lessonId: string, liked: boolean): Promise<LikeState> => {
    const url = `/watch/lessons/${lessonId}/like`;
    const response = liked
      ? await axiosClient.put<ApiResponse<LikeState>>(url, undefined, { timeout: REQUEST_TIMEOUT_MS })
      : await axiosClient.delete<ApiResponse<LikeState>>(url, { timeout: REQUEST_TIMEOUT_MS });
    return response.data.data;
  },

  setSaved: async (sentenceId: string, saved: boolean): Promise<void> => {
    const url = `/watch/sentences/${sentenceId}/saved`;
    if (saved) await axiosClient.put(url, undefined, { timeout: REQUEST_TIMEOUT_MS });
    else await axiosClient.delete(url, { timeout: REQUEST_TIMEOUT_MS });
  },
};
