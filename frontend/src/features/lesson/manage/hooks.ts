import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CREDIT_QUERY_KEY } from "@/features/subscription/hooks/useCredit";
import { lessonManageApi } from "./api";
import type { CreateLessonInput, LessonListFilter, ManageRole, NewSentence, SentenceEdit, UpdateLessonInput } from "./types";

export const lessonManageKeys = {
  all: ["lesson", "manage"] as const,
  list: (role: ManageRole, filter: LessonListFilter, page: number) =>
    [...lessonManageKeys.all, "list", role, filter, page] as const,
  detail: (role: ManageRole, lessonId: string) => [...lessonManageKeys.all, "detail", role, lessonId] as const,
  topics: () => [...lessonManageKeys.all, "topics"] as const,
  preview: (videoId: string) => [...lessonManageKeys.all, "preview", videoId] as const,
};

const TOPICS_STALE_MS = 5 * 60 * 1000;

/** Không tự thử lại: lỗi hiện ngay kèm nút "Thử lại". */
export function useLessonList(role: ManageRole, filter: LessonListFilter, page: number) {
  return useQuery({
    queryKey: lessonManageKeys.list(role, filter, page),
    queryFn: () => lessonManageApi.list(role, filter, page),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useLessonDetail(role: ManageRole, lessonId: string | undefined) {
  return useQuery({
    queryKey: lessonManageKeys.detail(role, lessonId ?? ""),
    queryFn: () => lessonManageApi.detail(role, lessonId ?? ""),
    enabled: Boolean(lessonId),
    retry: false,
  });
}

export function useLessonTopics() {
  return useQuery({
    queryKey: lessonManageKeys.topics(),
    queryFn: lessonManageApi.topics,
    staleTime: TOPICS_STALE_MS,
  });
}

/** Xem trước video theo ID; cùng video thì dùng lại kết quả, lỗi (video quá dài, đã có bài...) hiện ngay không thử lại. */
export function useYouTubePreview(youtubeUrl: string, videoId: string | null) {
  return useQuery({
    queryKey: lessonManageKeys.preview(videoId ?? ""),
    queryFn: () => lessonManageApi.preview(youtubeUrl),
    enabled: videoId !== null,
    retry: false,
    staleTime: 60_000,
  });
}


/** Sau mọi thao tác đổi bài, tải lại danh sách và chi tiết (danh sách cũ có thể đã lệch). */
function useLessonMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: lessonManageKeys.all }),
  });
}

export function useCreateLesson() {
  return useLessonMutation((input: CreateLessonInput) => lessonManageApi.create(input));
}

export function useUpdateLesson(lessonId: string) {
  return useLessonMutation((input: UpdateLessonInput) => lessonManageApi.update(lessonId, input));
}

export function useUpdateSentences(lessonId: string) {
  return useLessonMutation(
    ({ sentences, deletedIds, added }: { sentences: SentenceEdit[]; deletedIds: string[]; added: NewSentence[] }) =>
      lessonManageApi.updateSentences(lessonId, sentences, deletedIds, added),
  );
}

/** Gợi ý chỉ điền vào ô, không đổi dữ liệu bài; chỉ đọc lại số dư credit vì gợi ý dịch có trừ credit. */
export function useSuggest(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof lessonManageApi.suggest>[1]) => lessonManageApi.suggest(lessonId, input),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: CREDIT_QUERY_KEY }),
  });
}

export function usePublishLesson() {
  return useLessonMutation((lessonId: string) => lessonManageApi.publish(lessonId));
}

export function useUnpublishLesson(role: ManageRole) {
  return useLessonMutation(({ lessonId, reason }: { lessonId: string; reason: string | null }) =>
    lessonManageApi.unpublish(role, lessonId, reason),
  );
}

export function useDeleteLesson() {
  return useLessonMutation((lessonId: string) => lessonManageApi.remove(lessonId));
}

export function useRestoreLesson() {
  return useLessonMutation(({ lessonId, title }: { lessonId: string; title: string | null }) =>
    lessonManageApi.restore(lessonId, title),
  );
}
