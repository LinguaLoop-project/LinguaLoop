import { useQuery } from "@tanstack/react-query";
import { lessonService } from "../services/lessonService";

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
  state?: string;
  mode?: string;
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

export const useLessonDetail = (slug: string) => {
  return useQuery({
    queryKey: ["lessons", "detail", slug],
    queryFn: () => lessonService.getLessonDetail(slug),
    enabled: !!slug,
  });
};

export const useLessonSentences = (slug: string) => {
  return useQuery({
    queryKey: ["lessons", "detail", slug, "sentences"],
    queryFn: () => lessonService.getSentences(slug),
    enabled: !!slug,
  });
};

export const useTopicList = () => {
  return useQuery({
    queryKey: ["topics"],
    queryFn: () => lessonService.getTopics(),
  });
};

export const useTopicDetail = (slug: string) => {
  return useQuery({
    queryKey: ["topics", "detail", slug],
    queryFn: () => lessonService.getTopic(slug),
    enabled: !!slug,
  });
};
