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

export interface SavedTopicCount {
  name: string;
  count: number;
}

export interface SavedSummary {
  total: number;
  todo: number;
  doing: number;
  done: number;
  totalDurationSec: number;
  topics: SavedTopicCount[];
}

export interface SavedCleared {
  removedCount: number;
  removedIds: string[];
}

export type SavedSort = "saved_desc" | "saved_asc" | "short" | "progress_desc";

export interface SavedLessonsQuery {
  q?: string;
  state?: LessonState;
  cefrLevel?: string;
  topic?: string;
  free?: boolean;
  maxDuration?: number;
  sort?: SavedSort;
  page?: number;
  size?: number;
}

export type StudyMode = "dictation" | "shadowing";

export const savedLessonsApi = {
  list: async (query: SavedLessonsQuery): Promise<PageResponse<SavedLesson>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<SavedLesson>>>("/lessons/saved", {
      params: {
        q: query.q || undefined,
        state: query.state,
        cefrLevel: query.cefrLevel || undefined,
        topic: query.topic || undefined,
        free: query.free ? true : undefined,
        maxDuration: query.maxDuration || undefined,
        sort: query.sort,
        page: query.page,
        size: query.size,
      },
    });
    return response.data.data;
  },

  summary: async (): Promise<SavedSummary> => {
    const response = await axiosClient.get<ApiResponse<SavedSummary>>("/lessons/saved/summary");
    return response.data.data;
  },

  clearCompleted: async (): Promise<SavedCleared> => {
    const response = await axiosClient.delete<ApiResponse<SavedCleared>>("/lessons/saved/completed");
    return response.data.data;
  },

  /** Lưu hoặc bỏ lưu một bài; gọi lặp lại không đổi gì thêm. */
  setSaved: async (lessonId: string, saved: boolean): Promise<void> => {
    const url = `/lessons/${lessonId}/saved`;
    if (saved) await axiosClient.put(url);
    else await axiosClient.delete(url);
  },
};
