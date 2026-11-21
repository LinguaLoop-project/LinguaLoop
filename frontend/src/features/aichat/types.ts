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

/** `live`: nói chuyện qua Gemini Live; `text`: chat chữ dự phòng. */
export type ChatMode = "live" | "text";

/** Kiểu trò chuyện của phiên giọng nói: hỏi đáp, phỏng vấn (học viên đóng vai nhân vật) hoặc kể lại video. */
export type ChatStyle = "qa" | "interview" | "retell";

/** Đoạn video của câu số `n` (từ 1) để gia sư mời học viên nghe lại. */
export interface ChatClip {
  n: number;
  startMs: number;
  endMs: number;
}

export interface ChatSession {
  id: string;
  mode: ChatMode;
  style: ChatStyle;
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

/** Giới hạn của phiên giọng nói; trình duyệt tự thực thi cùng server (BR-AI-11). */
export interface ChatLimits {
  maxQuestions: number;
  maxSeconds: number;
  wrapUpAtSeconds: number;
  startTimeoutSeconds: number;
  idleAskSeconds: number;
  idleEndSeconds: number;
}

/** Phiên giọng nói vừa tạo: token Gemini Live dùng một lần. Chưa trừ credit, `cost` sẽ trừ khi gia sư nói câu đầu. */
export interface LiveStart {
  id: string;
  token: string;
  model: string;
  tokenExpiresAt: string;
  limits: ChatLimits;
  cost: number;
  balance: CreditBalance;
  style: ChatStyle;
  clips: ChatClip[];
}
