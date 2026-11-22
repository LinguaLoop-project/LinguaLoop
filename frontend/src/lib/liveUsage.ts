import type { UsageMetadata } from "@google/genai";

/** Số token một phiên Gemini Live đã dùng, gửi về backend để ghi chi phí (BR-GA-12). */
export type LiveUsage = { inputTokens: number; outputTokens: number };

/**
 * Cộng dồn số token Gemini Live báo về trong từng tin nhắn của một phiên. Gemini tính lại toàn bộ ngữ cảnh ở mỗi
 * lượt nên cộng từng lần báo mới sát với chi phí thật; chỉ lấy lần báo cuối sẽ thấp hơn nhiều.
 */
export class LiveUsageMeter {
  #input = 0;
  #output = 0;

  add(usage: UsageMetadata | undefined) {
    if (!usage) return;
    this.#input += count(usage.promptTokenCount) + count(usage.toolUsePromptTokenCount);
    this.#output += count(usage.responseTokenCount) + count(usage.thoughtsTokenCount);
  }

  /** Lấy tổng rồi đặt lại về 0, để mỗi phiên chỉ được báo một lần. */
  take(): LiveUsage {
    const usage = { inputTokens: this.#input, outputTokens: this.#output };
    this.#input = 0;
    this.#output = 0;
    return usage;
  }
}

function count(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
