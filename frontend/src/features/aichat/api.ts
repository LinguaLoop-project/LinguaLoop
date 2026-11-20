import { axiosClient } from "@/api/axiosClient";
import type { ApiResponse } from "@/features/lesson/types";
import type { ChatAnswer, ChatHint, ChatHistoryItem, ChatSession, ChatTurn } from "./types";

const base = (lessonId: string) => `/lessons/${lessonId}/ai-chat`;

export const aiChatApi = {
  /** Phiên đang mở của bài để tiếp tục; null nếu không có (hoặc đã quá 15 phút). */
  active: async (lessonId: string): Promise<ChatSession | null> =>
    (await axiosClient.get<ApiResponse<ChatSession | null>>(`${base(lessonId)}/active`)).data.data,

  /** Bắt đầu cuộc mới; cũng là "Bắt đầu lại": phiên đang mở được đóng và giữ trong lịch sử. */
  start: async (lessonId: string): Promise<ChatTurn> =>
    (await axiosClient.post<ApiResponse<ChatTurn>>(`${base(lessonId)}/sessions`)).data.data,

  history: async (lessonId: string): Promise<ChatHistoryItem[]> =>
    (await axiosClient.get<ApiResponse<ChatHistoryItem[]>>(`${base(lessonId)}/sessions`)).data.data,

  detail: async (lessonId: string, sessionId: string): Promise<ChatSession> =>
    (await axiosClient.get<ApiResponse<ChatSession>>(`${base(lessonId)}/sessions/${sessionId}`)).data.data,

  answer: async (lessonId: string, sessionId: string, answer: ChatAnswer): Promise<ChatTurn> => {
    const form = new FormData();
    if ("text" in answer) form.append("text", answer.text);
    else form.append("audio", answer.audio, "answer.wav");
    return (await axiosClient.post<ApiResponse<ChatTurn>>(`${base(lessonId)}/sessions/${sessionId}/answers`, form)).data.data;
  },

  hint: async (lessonId: string, sessionId: string): Promise<ChatHint> =>
    (await axiosClient.post<ApiResponse<ChatHint>>(`${base(lessonId)}/sessions/${sessionId}/hint`)).data.data,

  finish: async (lessonId: string, sessionId: string): Promise<ChatTurn> =>
    (await axiosClient.post<ApiResponse<ChatTurn>>(`${base(lessonId)}/sessions/${sessionId}/finish`)).data.data,
};
