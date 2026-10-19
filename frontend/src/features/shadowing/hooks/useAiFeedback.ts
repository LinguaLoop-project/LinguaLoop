import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { USAGE_QUERY_KEY } from "@/features/subscription/hooks/useUsage";
import type { UsageResponse } from "@/features/subscription/types";
import { shadowingService } from "../services/shadowingService";

/**
 * Xin Nhận xét AI cho một lượt và nhận chữ dần trong `text` (giao diện hiện chữ chạy ra thay vì chờ cả đoạn). Phản hồi
 * cuối kèm số lượt mới nên cập nhật thẳng vào mức dùng thay vì gọi lại /me/usage.
 */
export const useAiFeedback = () => {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const mutation = useMutation({
    mutationFn: (attemptId: number) => {
      setText("");
      return shadowingService.streamAiFeedback(attemptId, (piece) => setText((current) => current + piece));
    },
    onSuccess: (result) => {
      queryClient.setQueryData<UsageResponse>(USAGE_QUERY_KEY, (old) =>
        old ? { features: old.features.map((f) => (f.feature === result.usage.feature ? result.usage : f)) } : old,
      );
    },
    onError: () => {
      // Hết lượt hoặc đã được hoàn lượt: đọc lại cho đúng
      void queryClient.invalidateQueries({ queryKey: USAGE_QUERY_KEY });
    },
  });
  const { reset: resetMutation } = mutation;
  return {
    ...mutation,
    text,
    reset: () => {
      setText("");
      resetMutation();
    },
  };
};
