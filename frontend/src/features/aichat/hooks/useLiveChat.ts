import { useEffect, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CREDIT_QUERY_KEY } from "@/features/subscription/hooks/useCredit";
import type { CreditBalance } from "@/features/subscription/types";
import { aiChatApi } from "../api";
import { LiveChatController } from "../controller";
import type { LiveChatState, PlayClip } from "../controller";
import type { ChatStyle } from "../types";

/**
 * Một controller cho mỗi lần mount: bắt đầu lại thì mount lại component (đặt key). Rời khỏi màn hình sẽ tự thoát phiên.
 * Số dư credit mới được ghi thẳng vào ví dùng chung.
 */
export function useLiveChat(
  lessonId: string,
  style: ChatStyle,
  playClip: PlayClip,
): { state: LiveChatState; controller: LiveChatController } {
  const queryClient = useQueryClient();
  const [controller] = useState(
    () =>
      new LiveChatController({
        lessonId,
        style,
        api: aiChatApi,
        onCredit: (balance: CreditBalance) => {
          queryClient.setQueryData<CreditBalance>(CREDIT_QUERY_KEY, balance);
        },
      }),
  );
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  // Hàm phát video đổi mỗi lần render; controller chỉ tạo một lần nên cập nhật hàm mới nhất vào nó
  useEffect(() => {
    controller.setPlayClip(playClip);
  });
  useEffect(() => () => controller.dispose(), [controller]);
  return { state, controller };
}
