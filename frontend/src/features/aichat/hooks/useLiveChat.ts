import { useEffect, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CREDIT_QUERY_KEY } from "@/features/subscription/hooks/useCredit";
import type { CreditBalance } from "@/features/subscription/types";
import { aiChatApi } from "../api";
import { LiveChatController } from "../controller";
import type { LiveChatState } from "../controller";

/**
 * Một controller cho mỗi lần mount: bắt đầu lại thì mount lại component (đặt key). Rời khỏi màn hình sẽ tự thoát phiên.
 * Số dư credit mới được ghi thẳng vào ví dùng chung.
 */
export function useLiveChat(lessonId: string): { state: LiveChatState; controller: LiveChatController } {
  const queryClient = useQueryClient();
  const [controller] = useState(
    () =>
      new LiveChatController({
        lessonId,
        api: aiChatApi,
        onCredit: (balance: CreditBalance) => {
          queryClient.setQueryData<CreditBalance>(CREDIT_QUERY_KEY, balance);
        },
      }),
  );
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  useEffect(() => () => controller.dispose(), [controller]);
  return { state, controller };
}
