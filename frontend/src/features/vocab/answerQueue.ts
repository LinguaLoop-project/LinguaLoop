import { isAxiosError } from "axios";
import { vocabApi } from "./api";
import type { AnswerInput } from "./types";

interface Pending {
  sessionId: string;
  input: AnswerInput;
}

const RETRY_MS = 8_000;

/**
 * Hàng đợi gửi câu trả lời (UC-HT-02, luồng 4a). Mất mạng thì giữ lại và gửi lại khi có mạng; mỗi câu có `answerId`
 * nên server chỉ ghi một lần dù gửi lặp. Sống ở cấp module để chuyển trang không làm mất câu chưa gửi (tải lại trang thì
 * mất).
 */
const queue: Pending[] = [];
const listeners = new Set<() => void>();
let flushing = false;
let timer: number | undefined;
let wired = false;

const notify = () => listeners.forEach((listener) => listener());

/** Lỗi tạm thời đáng thử lại: mất mạng hoặc server lỗi; còn 4xx (khoá Pro, phiên hết hạn ...) thì bỏ câu đó. */
const isRetryable = (error: unknown) => isAxiosError(error) && (!error.response || error.response.status >= 500);

async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    while (queue.length > 0) {
      const next = queue[0];
      try {
        await vocabApi.sendAnswer(next.sessionId, next.input);
        queue.shift();
      } catch (error) {
        if (isRetryable(error)) break;
        queue.shift();
      }
      notify();
    }
  } finally {
    flushing = false;
    notify();
    schedule();
  }
}

function schedule() {
  window.clearTimeout(timer);
  timer = queue.length > 0 ? window.setTimeout(() => void flush(), RETRY_MS) : undefined;
}

export const answerQueue = {
  /** Đưa một câu trả lời vào hàng đợi và gửi ngay. */
  enqueue(sessionId: string, input: AnswerInput) {
    if (!wired) {
      wired = true;
      window.addEventListener("online", () => void flush());
    }
    queue.push({ sessionId, input });
    notify();
    void flush();
  },
  /** Số câu chưa gửi được. */
  size: () => queue.length,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  flush,
  /** Chỉ cho test: xoá hàng đợi. */
  reset() {
    queue.length = 0;
    window.clearTimeout(timer);
    notify();
  },
};
