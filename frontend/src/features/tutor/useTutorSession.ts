import { useEffect, useState, useSyncExternalStore } from "react";
import { TutorSessionController } from "./controller";
import type { TutorParams, TutorState } from "./controller";

/**
 * Một controller cho mỗi lần mount: đổi câu hoặc kết quả chấm thì mount lại component (đặt key).
 * Rời khỏi màn hình sẽ tự thoát phiên.
 */
export function useTutorSession(params: TutorParams): { state: TutorState; controller: TutorSessionController } {
  const [controller] = useState(() => new TutorSessionController(params));
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  useEffect(() => () => controller.dispose(), [controller]);
  return { state, controller };
}
