import { useCallback, useEffect, useRef } from "react";
import { answerQueue } from "./answerQueue";
import type { AnswerDraft, AnswerInput } from "./types";

/**
 * Hàm gửi câu trả lời của một phiên học hoặc phiên ôn: gắn `answerId` rồi đưa vào hàng đợi gửi lại khi mất mạng. Câu trả
 * lời đến trước khi phiên mở xong (hiếm) được giữ lại rồi gửi khi có `sessionId`.
 */
export function useAnswerSubmit(sessionId: string | null) {
  const early = useRef<AnswerInput[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    for (const answer of early.current.splice(0)) answerQueue.enqueue(sessionId, answer);
  }, [sessionId]);

  return useCallback(
    (answer: AnswerDraft) => {
      const full: AnswerInput = { ...answer, answerId: crypto.randomUUID() };
      if (sessionId) answerQueue.enqueue(sessionId, full);
      else early.current.push(full);
    },
    [sessionId],
  );
}
