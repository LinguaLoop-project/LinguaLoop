import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CREDIT_QUERY_KEY } from "@/features/subscription/hooks/useCredit";
import type { CreditBalance } from "@/features/subscription/types";
import { aiChatApi } from "../api";
import type { ChatAnswer, ChatTurn } from "../types";

const key = (lessonId: string, ...rest: string[]) => ["aichat", lessonId, ...rest] as const;

/** Phiên đang mở của bài; không cache lâu vì đồng hồ 15 phút chạy ở server. */
export const useActiveChat = (lessonId: string) =>
  useQuery({ queryKey: key(lessonId, "active"), queryFn: () => aiChatApi.active(lessonId), staleTime: 0, gcTime: 0 });

export const useChatHistory = (lessonId: string, enabled: boolean) =>
  useQuery({ queryKey: key(lessonId, "history"), queryFn: () => aiChatApi.history(lessonId), enabled });

export const useChatDetail = (lessonId: string, sessionId: string | null) =>
  useQuery({
    queryKey: key(lessonId, "detail", sessionId ?? ""),
    queryFn: () => aiChatApi.detail(lessonId, sessionId as string),
    enabled: !!sessionId,
  });

/**
 * Các thao tác của một cuộc trò chuyện. Mỗi lượt có gọi AI trả kèm số dư credit mới nên ghi thẳng vào ví thay vì gọi lại
 * /credits/balance; lỗi thì đọc lại số dư cho đúng (server có thể đã ghi nhận lượt thất bại).
 */
export function useChatActions(lessonId: string) {
  const queryClient = useQueryClient();
  const settle = (turn: ChatTurn) => {
    queryClient.setQueryData<CreditBalance>(CREDIT_QUERY_KEY, turn.credit.balance);
    void queryClient.invalidateQueries({ queryKey: key(lessonId, "history") });
  };
  const refreshCredit = () => void queryClient.invalidateQueries({ queryKey: CREDIT_QUERY_KEY });

  const start = useMutation({ mutationFn: () => aiChatApi.start(lessonId), onSuccess: settle, onError: refreshCredit });
  const answer = useMutation({
    mutationFn: ({ sessionId, answer }: { sessionId: string; answer: ChatAnswer }) =>
      aiChatApi.answer(lessonId, sessionId, answer),
    onSuccess: settle,
    onError: refreshCredit,
  });
  const finish = useMutation({
    mutationFn: (sessionId: string) => aiChatApi.finish(lessonId, sessionId),
    onSuccess: settle,
    onError: refreshCredit,
  });
  const hint = useMutation({ mutationFn: (sessionId: string) => aiChatApi.hint(lessonId, sessionId) });
  return { start, answer, finish, hint };
}
