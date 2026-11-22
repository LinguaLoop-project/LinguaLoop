import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/lesson/types";
import type { LiveUsage } from "@/lib/liveUsage";
import type { ChatCredit, ChatHint, ChatHistoryItem, ChatSession, ChatStyle, ChatTurn, LiveStart } from "./types";

const base = (lessonId: string) => `/lessons/${lessonId}/ai-chat`;
const live = (lessonId: string, sessionId: string) => `${base(lessonId)}/live-sessions/${sessionId}`;

export const aiChatApi = {
  // ── Chế độ giọng nói (Gemini Live) ──
  /** Mở phiên giọng nói; cũng là "Bắt đầu lại". Chưa trừ credit. */
  startLive: async (lessonId: string, style: ChatStyle): Promise<LiveStart> =>
    (await axiosClient.post<ApiResponse<LiveStart>>(`${base(lessonId)}/live-sessions`, { style })).data.data,

  /** Gia sư đã nói câu đầu: trừ credit cố định một lần. */
  liveStarted: async (lessonId: string, sessionId: string): Promise<ChatCredit> =>
    (await axiosClient.post<ApiResponse<ChatCredit>>(`${live(lessonId, sessionId)}/started`)).data.data,

  liveQuestion: async (lessonId: string, sessionId: string, question: string): Promise<ChatSession> =>
    (await axiosClient.post<ApiResponse<ChatSession>>(`${live(lessonId, sessionId)}/questions`, { question })).data.data,

  liveFeedback: async (
    lessonId: string,
    sessionId: string,
    body: { answer: string; feedback: string; better: string },
  ): Promise<ChatSession> =>
    (await axiosClient.post<ApiResponse<ChatSession>>(`${live(lessonId, sessionId)}/feedback`, body)).data.data,

  liveFinish: async (lessonId: string, sessionId: string): Promise<ChatTurn> =>
    (await axiosClient.post<ApiResponse<ChatTurn>>(`${live(lessonId, sessionId)}/finish`)).data.data,

  /** Báo số token Gemini Live đã dùng khi phiên đóng để ghi chi phí (BR-GA-12); không trừ credit, gọi lại không ghi thêm. */
  liveUsage: async (lessonId: string, sessionId: string, usage: LiveUsage): Promise<void> => {
    await axiosClient.post(`${live(lessonId, sessionId)}/usage`, usage);
  },

  // ── Chế độ chat chữ (dự phòng) ──
  start: async (lessonId: string): Promise<ChatTurn> =>
    (await axiosClient.post<ApiResponse<ChatTurn>>(`${base(lessonId)}/sessions`)).data.data,

  answer: async (lessonId: string, sessionId: string, text: string): Promise<ChatTurn> =>
    (await axiosClient.post<ApiResponse<ChatTurn>>(`${base(lessonId)}/sessions/${sessionId}/answers`, { text })).data.data,

  finish: async (lessonId: string, sessionId: string): Promise<ChatTurn> =>
    (await axiosClient.post<ApiResponse<ChatTurn>>(`${base(lessonId)}/sessions/${sessionId}/finish`)).data.data,

  // ── Dùng chung ──
  hint: async (lessonId: string, sessionId: string): Promise<ChatHint> =>
    (await axiosClient.post<ApiResponse<ChatHint>>(`${base(lessonId)}/sessions/${sessionId}/hint`)).data.data,

  history: async (lessonId: string): Promise<ChatHistoryItem[]> =>
    (await axiosClient.get<ApiResponse<ChatHistoryItem[]>>(`${base(lessonId)}/sessions`)).data.data,

  detail: async (lessonId: string, sessionId: string): Promise<ChatSession> =>
    (await axiosClient.get<ApiResponse<ChatSession>>(`${base(lessonId)}/sessions/${sessionId}`)).data.data,
};

export type AiChatApi = typeof aiChatApi;
