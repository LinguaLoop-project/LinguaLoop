import { describe, expect, it } from "vitest";
import { reviewPromptKind } from "./reviewPrompt";

describe("reviewPromptKind", () => {
  it("hỏi lưu khi dưới 60 điểm và câu chưa ở trong danh sách", () => {
    expect(reviewPromptKind(0, false)).toBe("save");
    expect(reviewPromptKind(59.99, false)).toBe("save");
  });

  it("không hỏi lưu khi câu đã ở trong danh sách", () => {
    expect(reviewPromptKind(20, true)).toBeNull();
  });

  it("hỏi bỏ khi từ 80 điểm và câu đang ở trong danh sách", () => {
    expect(reviewPromptKind(80, true)).toBe("remove");
    expect(reviewPromptKind(100, true)).toBe("remove");
  });

  it("không hỏi bỏ khi câu không ở trong danh sách", () => {
    expect(reviewPromptKind(95, false)).toBeNull();
  });

  it("không hỏi gì ở khoảng 60 đến 79 điểm", () => {
    expect(reviewPromptKind(60, false)).toBeNull();
    expect(reviewPromptKind(79.9, true)).toBeNull();
  });
});
