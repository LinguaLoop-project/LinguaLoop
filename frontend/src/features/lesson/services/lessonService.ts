import { axiosClient } from "@/api/axiosClient";
import type {
  ApiResponse,
  LessonDetail,
  LessonSummary,
  LibraryOverview,
  PageResponse,
  SentenceResponse,
  TopicResponse,
  TopicRow,
} from "../types";

export const lessonService = {
  getOverview: async (): Promise<LibraryOverview> => {
    const response = await axiosClient.get<ApiResponse<LibraryOverview>>(
      "/lessons/overview"
    );
    return response.data.data;
  },

  searchLessons: async (params: {
    q?: string;
    topic?: string;
    difficulty?: string;
    free?: boolean;
    state?: string;
    mode?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<LessonSummary>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<LessonSummary>>
    >("/lessons", { params });
    return response.data.data;
  },

  getLessonDetail: async (slug: string): Promise<LessonDetail> => {
    const response = await axiosClient.get<ApiResponse<LessonDetail>>(
      `/lessons/${slug}`
    );
    return response.data.data;
  },

  getSentences: async (slug: string): Promise<SentenceResponse[]> => {
    const response = await axiosClient.get<ApiResponse<SentenceResponse[]>>(
      `/lessons/${slug}/sentences`
    );
    return response.data.data;
  },

  getTopics: async (): Promise<TopicResponse[]> => {
    const response = await axiosClient.get<ApiResponse<TopicResponse[]>>(
      "/topics"
    );
    return response.data.data;
  },

  getTopic: async (slug: string): Promise<TopicRow> => {
    const response = await axiosClient.get<ApiResponse<TopicRow>>(
      `/topics/${slug}`
    );
    return response.data.data;
  },
};
