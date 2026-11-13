import { axiosClient } from "@/api/axiosClient";
import type {
  ApiResponse,
  LessonDetail,
  LessonState,
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
    topicId?: string;
    cefrLevel?: string;
    free?: boolean;
    state?: LessonState;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<LessonSummary>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<LessonSummary>>
    >("/lessons", { params });
    return response.data.data;
  },

  getLessonDetail: async (id: string): Promise<LessonDetail> => {
    const response = await axiosClient.get<ApiResponse<LessonDetail>>(
      `/lessons/${id}`
    );
    return response.data.data;
  },

  getSentences: async (id: string): Promise<SentenceResponse[]> => {
    const response = await axiosClient.get<ApiResponse<SentenceResponse[]>>(
      `/lessons/${id}/sentences`
    );
    return response.data.data;
  },

  getTopics: async (): Promise<TopicResponse[]> => {
    const response = await axiosClient.get<ApiResponse<TopicResponse[]>>(
      "/topics"
    );
    return response.data.data;
  },

  getTopic: async (id: string): Promise<TopicRow> => {
    const response = await axiosClient.get<ApiResponse<TopicRow>>(
      `/topics/${id}`
    );
    return response.data.data;
  },
};
