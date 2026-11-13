import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CREDIT_QUERY_KEY } from "@/features/subscription/hooks/useCredit";
import type { CreditBalance } from "@/features/subscription/types";
import { shadowingService } from "../services/shadowingService";

/**
 * Xin Nhận xét AI cho một lượt và nhận chữ dần trong `text` (giao diện hiện chữ chạy ra thay vì chờ cả đoạn). Phản hồi
 * cuối kèm số dư credit mới nên cập nhật thẳng vào ví thay vì gọi lại /credits/balance.
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
      if (result.credit) queryClient.setQueryData<CreditBalance>(CREDIT_QUERY_KEY, result.credit);
    },
    onError: () => {
      // Hết credit hoặc lỗi giữa chừng: đọc lại cho đúng
      void queryClient.invalidateQueries({ queryKey: CREDIT_QUERY_KEY });
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
