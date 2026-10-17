import { useQuery } from "@tanstack/react-query";
import { lessonService } from "../services/lessonService";
import type { LessonState } from "../types";

// Nội dung do giảng viên soạn, không đổi theo người học: giữ lâu để chuyển trang không gọi lại API.
const STATIC_CONTENT_STALE_TIME = 10 * 60 * 1000;

export const useLessonOverview = () => {
  return useQuery({
    queryKey: ["lessons", "overview"],
    queryFn: () => lessonService.getOverview(),
  });
};

export const useLessonSearch = (params: {
  q?: string;
  topic?: string;
  difficulty?: string;
  free?: boolean;
  state?: LessonState;
  page?: number;
  size?: number;
  sort?: string;
}) => {
  return useQuery({
    queryKey: ["lessons", "search", params],
    queryFn: () => lessonService.searchLessons(params),
    placeholderData: (prev) => prev,
  });
};

export const useLessonDetail = (slug?: string) => {
  return useQuery({
    queryKey: ["lessons", "detail", slug],
    queryFn: () => lessonService.getLessonDetail(slug!),
    enabled: !!slug,
  });
};

export const useLessonSentences = (slug?: string) => {
  return useQuery({
    queryKey: ["lessons", "detail", slug, "sentences"],
    queryFn: () => lessonService.getSentences(slug!),
    staleTime: STATIC_CONTENT_STALE_TIME,
    enabled: !!slug,
  });
};

export const useTopicList = () => {
  return useQuery({
    queryKey: ["topics"],
    queryFn: () => lessonService.getTopics(),
    staleTime: STATIC_CONTENT_STALE_TIME,
  });
};

export const useTopicDetail = (slug?: string) => {
  return useQuery({
    queryKey: ["topics", "detail", slug],
    queryFn: () => lessonService.getTopic(slug!),
    staleTime: STATIC_CONTENT_STALE_TIME,
    enabled: !!slug,
  });
};
