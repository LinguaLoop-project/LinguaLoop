import { describe, expect, it } from "vitest";
import { parseFeedback } from "./feedback";

const full = JSON.stringify({
  v: 2,
  summary: "Bạn đọc khá liền mạch.",
  strengths: ["Từ it đọc đúng."],
  issues: [
    {
      words: ["without", "the"],
      phonemes: ["ð"],
      problem: "Âm /ð/ nghe giống /d/.",
      tips: [{ phoneme: "ð", text: "Đặt lưỡi giữa hai răng." }],
    },
  ],
  omitted: ["for"],
  next: { action: "listen_word", word: "without" },
});

describe("parseFeedback", () => {
  it("đọc nhận xét có cấu trúc", () => {
    const feedback = parseFeedback(full);

    expect(feedback?.summary).toBe("Bạn đọc khá liền mạch.");
    expect(feedback?.issues).toEqual([
      {
        words: ["without", "the"],
        phonemes: ["ð"],
        problem: "Âm /ð/ nghe giống /d/.",
        tips: [{ phoneme: "ð", text: "Đặt lưỡi giữa hai răng." }],
      },
    ]);
    expect(feedback?.omitted).toEqual(["for"]);
    expect(feedback?.next).toEqual({ action: "listen_word", word: "without" });
  });

  it("nhận xét cũ là văn xuôi thì trả null để hiện nguyên văn", () => {
    expect(parseFeedback("Bạn đọc khá tốt, chú ý âm /θ/.")).toBeNull();
    expect(parseFeedback(null)).toBeNull();
    expect(parseFeedback("   ")).toBeNull();
  });

  it("JSON hỏng hoặc thiếu phần tổng quan thì trả null", () => {
    expect(parseFeedback("{không phải json")).toBeNull();
    expect(parseFeedback('{"issues": []}')).toBeNull();
    expect(parseFeedback('{"summary": "  "}')).toBeNull();
  });

  it("điền mặc định an toàn cho phần thiếu và bỏ lỗi sai dạng", () => {
    const feedback = parseFeedback(
      JSON.stringify({
        summary: "Tổng quan.",
        issues: [{ words: [], problem: "Không có từ." }, { words: ["a"] }, { words: ["watch"], problem: "Lỗi.", tips: [{ phoneme: "w" }, 5] }],
        next: { action: "dance" },
      }),
    );

    expect(feedback?.strengths).toEqual([]);
    expect(feedback?.omitted).toEqual([]);
    expect(feedback?.issues).toEqual([{ words: ["watch"], phonemes: [], problem: "Lỗi.", tips: [] }]);
    expect(feedback?.next).toEqual({ action: "retry", word: null });
  });
});
