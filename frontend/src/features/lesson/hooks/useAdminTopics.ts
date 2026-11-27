import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TopicListFilter } from "../adminTopics";
import { adminTopicService } from "../services/adminTopicService";

export const ADMIN_TOPICS_KEY = ["admin", "topics"] as const;

/** Danh sách chủ đề theo bộ lọc (UC-CD-01); giữ danh sách cũ trong lúc tải kết quả lọc mới. */
export function useAdminTopics(filter: TopicListFilter) {
  return useQuery({
    queryKey: [...ADMIN_TOPICS_KEY, filter],
    queryFn: () => adminTopicService.list(filter),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

function useInvalidateTopics() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ADMIN_TOPICS_KEY });
}

export function useCreateTopic() {
  const invalidate = useInvalidateTopics();
  return useMutation({ mutationFn: (name: string) => adminTopicService.create(name), onSuccess: invalidate });
}

export function useRenameTopic() {
  const invalidate = useInvalidateTopics();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => adminTopicService.rename(id, name),
    onSuccess: invalidate,
  });
}
