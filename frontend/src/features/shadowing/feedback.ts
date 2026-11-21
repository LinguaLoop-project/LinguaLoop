/** Nhận xét AI có cấu trúc (phiên bản 2), do backend chuẩn hóa. Nhận xét cũ là văn xuôi nên `parseFeedback` trả null. */
export interface FeedbackIssue {
  /** Các từ của câu mẫu có chung lỗi này (đã gom theo âm). */
  words: string[];
  /** Ký hiệu âm yếu, có thể trống. */
  phonemes: string[];
  problem: string;
  /** Mẹo khẩu hình do hệ thống gắn theo từng âm, không phải AI viết; trống khi các âm chưa có mẹo. */
  tips: Array<{ phoneme: string; text: string }>;
}

export type FeedbackAction = "keep_going" | "listen_word" | "ask_tutor" | "retry";

export interface StructuredFeedback {
  summary: string;
  strengths: string[];
  issues: FeedbackIssue[];
  /** Từ bị bỏ sót, gom thành một mục thay vì nhiều lỗi phát âm. */
  omitted: string[];
  next: { action: FeedbackAction; word: string | null };
}

const ACTIONS: FeedbackAction[] = ["keep_going", "listen_word", "ask_tutor", "retry"];

const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === "string");

/** Đọc nội dung nhận xét đã lưu: JSON có cấu trúc thì trả đối tượng, văn xuôi cũ hoặc JSON hỏng thì trả null để hiện nguyên văn. */
export function parseFeedback(content: string | null | undefined): StructuredFeedback | null {
  const text = content?.trim();
  if (!text || !text.startsWith("{")) return null;
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    if (typeof raw.summary !== "string" || !raw.summary.trim()) return null;
    const issues = Array.isArray(raw.issues) ? raw.issues : [];
    const next = (raw.next ?? {}) as { action?: unknown; word?: unknown };
    return {
      summary: raw.summary.trim(),
      strengths: isStrings(raw.strengths) ? raw.strengths : [],
      issues: issues
        .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
        .filter((i) => isStrings(i.words) && i.words.length > 0 && typeof i.problem === "string")
        .map((i) => ({
          words: i.words as string[],
          phonemes: isStrings(i.phonemes) ? i.phonemes : [],
          problem: i.problem as string,
          tips: Array.isArray(i.tips)
            ? i.tips.filter(
                (tip): tip is { phoneme: string; text: string } =>
                  typeof tip === "object" && tip !== null && typeof tip.phoneme === "string" && typeof tip.text === "string",
              )
            : [],
        })),
      omitted: isStrings(raw.omitted) ? raw.omitted : [],
      next: {
        action: ACTIONS.includes(next.action as FeedbackAction) ? (next.action as FeedbackAction) : "retry",
        word: typeof next.word === "string" && next.word ? next.word : null,
      },
    };
  } catch {
    return null;
  }
}
