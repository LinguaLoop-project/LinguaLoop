import type { CreditBalance } from "@/features/subscription/types";

/** Một dòng hội thoại: câu hỏi của gia sư hoặc câu trả lời của học viên kèm nhận xét. */
export interface ChatMessage {
  id: number;
  role: "tutor" | "student";
  text: string;
  feedback: string | null;
  better: string | null;
  hint: string | null;
  voice: boolean;
  at: string;
}

export type ChatStatus = "active" | "completed" | "error";

export interface ChatSession {
  id: string;
  status: ChatStatus;
  startedAt: string;
  endedAt: string | null;
  /** Mốc hết 15 phút (BR-AI-11). */
  expiresAt: string;
  answered: number;
  maxQuestions: number;
  /** Đã trả lời đủ nhưng nhận xét tổng quát chưa tạo được: bấm Kết thúc để tạo lại. */
  awaitingSummary: boolean;
  summary: string | null;
  messages: ChatMessage[];
}

export interface ChatCredit {
  charged: number;
  balance: CreditBalance;
}

/** Kết quả một yêu cầu có gọi AI. `expired`: phiên quá 15 phút nên câu trả lời không được nhận. */
export interface ChatTurn {
  session: ChatSession;
  credit: ChatCredit;
  expired: boolean;
}

export interface ChatHint {
  hint: string;
  cached: boolean;
}

export interface ChatHistoryItem {
  id: string;
  status: ChatStatus;
  startedAt: string;
  endedAt: string | null;
  answered: number;
  hasSummary: boolean;
}

/** Câu trả lời gửi lên: chữ hoặc bản ghi WAV, đúng một trong hai. */
export type ChatAnswer = { text: string } | { audio: Blob };
