import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse, LessonState, ModeProgress, PageResponse } from "./types";

/** Bài còn mở được không: `unavailable` là bài đã gỡ hoặc xóa, `pro_required` là bài Pro khi hết gói (UC-TC-05). */
export type SavedAvailability = "available" | "unavailable" | "pro_required";

export interface SavedLesson {
  id: string;
  title: string;
  cefrLevel: string;
  youtubeId: string;
  durationSec: number | null;
  topicName: string | null;
  pro: boolean;
  availability: SavedAvailability;
  sentenceCount: number;
  progress: ModeProgress;
  savedAt: string;
}

export type SavedSort = "saved_desc" | "saved_asc";

export interface SavedLessonsQuery {
  q?: string;
  state?: LessonState;
  sort?: SavedSort;
  page?: number;
}

export type StudyMode = "dictation" | "shadowing";

export const savedLessonsApi = {
  list: async (query: SavedLessonsQuery): Promise<PageResponse<SavedLesson>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<SavedLesson>>>("/lessons/saved", {
      params: { q: query.q || undefined, state: query.state, sort: query.sort, page: query.page },
    });
    return response.data.data;
  },

  /** Lưu hoặc bỏ lưu một bài; gọi lặp lại không đổi gì thêm. */
  setSaved: async (lessonId: string, saved: boolean): Promise<void> => {
    const url = `/lessons/${lessonId}/saved`;
    if (saved) await axiosClient.put(url);
    else await axiosClient.delete(url);
  },
};
