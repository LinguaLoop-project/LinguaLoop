import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedLessonsApi, type SavedLessonsQuery } from "../savedLessons";
import type { LessonDetail } from "../types";

export const savedKeys = {
  all: ["lessons", "saved"] as const,
  list: (query: SavedLessonsQuery) => ["lessons", "saved", "list", query] as const,
  summary: () => ["lessons", "saved", "summary"] as const,
};

/** Bài đã lưu của học viên (UC-TC-05); giữ danh sách cũ trên màn hình trong lúc tải trang hoặc bộ lọc mới. */
export const useSavedLessons = (query: SavedLessonsQuery) =>
  useQuery({
    queryKey: savedKeys.list(query),
    queryFn: () => savedLessonsApi.list(query),
    placeholderData: (previous) => previous,
    networkMode: "always",
    retry: 1,
  });

/** Thống kê tổng quan (tổng, chưa học, đang học, đã xong, danh sách chủ đề) của toàn bộ Bài đã lưu. */
export const useSavedSummary = () =>
  useQuery({
    queryKey: savedKeys.summary(),
    queryFn: () => savedLessonsApi.summary(),
    networkMode: "always",
    retry: 1,
  });

/** Bỏ lưu hàng loạt toàn bộ bài đã hoàn thành. */
export function useClearCompletedSaved() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => savedLessonsApi.clearCompleted(),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: savedKeys.all });
      void client.invalidateQueries({ queryKey: ["lessons", "overview"] });
      void client.invalidateQueries({ queryKey: ["lessons", "search"] });
    },
  });
}

/**
 * Lưu hoặc bỏ lưu một bài. Cập nhật ngay cờ `saved` của chi tiết bài trong bộ nhớ đệm, lỗi thì trả lại như cũ; xong thì
 * làm mới danh sách Bài đã lưu.
 */
export function useToggleLessonSaved() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, saved }: { lessonId: string; saved: boolean }) =>
      savedLessonsApi.setSaved(lessonId, saved),
    onMutate: async ({ lessonId, saved }) => {
      const key = ["lessons", "detail", lessonId] as const;
      await client.cancelQueries({ queryKey: key, exact: true });
      const previous = client.getQueryData<LessonDetail>(key);
      if (previous) client.setQueryData<LessonDetail>(key, { ...previous, saved });
      return { key, previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) client.setQueryData(context.key, context.previous);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: savedKeys.all });
      void client.invalidateQueries({ queryKey: ["lessons", "overview"] });
      void client.invalidateQueries({ queryKey: ["lessons", "search"] });
    },
  });
}
