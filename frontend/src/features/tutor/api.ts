import { isAxiosError } from "axios";
import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/lesson/types";
import type {
  AttemptResult,
  AttemptTarget,
  CreatedSession,
  LessonEvent,
  OfferResult,
  PracticeWord,
  SessionOutcome,
  SwitchResult,
  TopicCategory,
  TopicResult,
} from "./types";

const BASE = "/tutor";

/**
 * Lỗi từ /tutor. `instruction` (chỉ dẫn chuyển cho gia sư) và `words` (Danh sách từ lỗi cho mẹo dạng chữ khi
 * TUTOR_LIVE_UNAVAILABLE) nằm trong `details` của phản hồi lỗi.
 */
export class TutorApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly instruction?: string;
  readonly words?: PracticeWord[];

  constructor(message: string, status: number, code: string, instruction?: string, words?: PracticeWord[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.instruction = instruction;
    this.words = words;
  }
}

export function toTutorError(err: unknown): TutorApiError {
  if (err instanceof TutorApiError) return err;
  if (!isAxiosError<{ code?: string; message?: string; details?: { instruction?: unknown; words?: unknown } }>(err)) {
    return new TutorApiError(err instanceof Error ? err.message : "", 0, "INTERNAL_ERROR");
  }
  const body = err.response?.data;
  const { instruction, words } = body?.details ?? {};
  return new TutorApiError(
    body?.message ?? err.message,
    err.response?.status ?? 0,
    err.response ? (body?.code ?? "INTERNAL_ERROR") : "NETWORK_ERROR",
    typeof instruction === "string" ? instruction : undefined,
    Array.isArray(words) ? (words as PracticeWord[]) : undefined,
  );
}

async function call<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await request).data.data;
  } catch (err) {
    throw toTutorError(err);
  }
}

/** Hỏi backend có nên tự mở gia sư sau Lượt shadowing vừa chấm không (luật nằm ở TutorOfferPolicy). */
export function evaluateOffer(attemptId: number): Promise<OfferResult> {
  return call(axiosClient.post(`${BASE}/offers`, { attemptId }));
}

/** Người học bỏ qua lần tự mở này. */
export async function declineOffer(offerId: string): Promise<void> {
  await call(axiosClient.post(`${BASE}/offers/${offerId}/decline`));
}

/** Ghi lại việc bật/tắt Chế độ gia sư để đo hiệu quả. */
export async function sendLessonEvent(lessonId: string, event: LessonEvent): Promise<void> {
  await call(axiosClient.post(`${BASE}/lesson-events`, { lessonId, event }));
}

export function createSession(attemptId: number, offerId: string | null): Promise<CreatedSession> {
  return call(axiosClient.post(`${BASE}/sessions`, { attemptId, offerId }));
}

export async function markStarted(sessionId: string): Promise<void> {
  await call(axiosClient.post(`${BASE}/sessions/${sessionId}/started`));
}

/** Đổi Từ đang luyện (gia sư gọi switch_word, hoặc người học bấm chip). */
export function switchWord(sessionId: string, word: string): Promise<SwitchResult> {
  return call(axiosClient.post(`${BASE}/sessions/${sessionId}/word`, { word }));
}

/** Gửi bản ghi một Lượt chấm; backend chấm bằng Azure và áp luật 3 lượt mỗi từ. */
export function uploadAttempt(sessionId: string, wav: Blob, target: AttemptTarget): Promise<AttemptResult> {
  const form = new FormData();
  form.append("audio", wav, "attempt.wav");
  form.append("target", target);
  return call(axiosClient.post(`${BASE}/sessions/${sessionId}/attempts`, form));
}

/** Ghi một lượt người học nói; backend đếm Lượt lạc đề và trả chỉ dẫn cho gia sư. */
export function postTopic(sessionId: string, topic: TopicCategory): Promise<TopicResult> {
  return call(axiosClient.post(`${BASE}/sessions/${sessionId}/events`, { type: "topic", topic }));
}

/** Trả về Kết quả phiên mà backend chốt (có thể khác giá trị frontend đề nghị). */
export async function endSession(sessionId: string, outcome: SessionOutcome): Promise<SessionOutcome> {
  const res = await call<{ outcome: SessionOutcome }>(
    axiosClient.post(`${BASE}/sessions/${sessionId}/events`, { type: "end", outcome }),
  );
  return res.outcome;
}

/** Trạng thái phiên (GET): `outcome` là null khi phiên còn mở. Chỉ dùng để biết phiên đã bị server đóng chưa. */
export async function getSession(sessionId: string): Promise<{ outcome: SessionOutcome | null }> {
  return call(axiosClient.get(`${BASE}/sessions/${sessionId}`));
}
