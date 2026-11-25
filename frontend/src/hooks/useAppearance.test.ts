import { describe, expect, it } from "vitest";
import { DEFAULT_APPEARANCE, parseAppearance } from "./appearance";

describe("parseAppearance (AC-TK-70)", () => {
  it("chưa lưu gì thì dùng mặc định: tím, vừa, không nền", () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(DEFAULT_APPEARANCE).toEqual({ accent: "violet", sentenceSize: "md", learnBackground: "none" });
  });

  it("đọc đúng giá trị đã lưu", () => {
    const raw = JSON.stringify({ accent: "pink", sentenceSize: "lg", learnBackground: "paper" });
    expect(parseAppearance(raw)).toEqual({ accent: "pink", sentenceSize: "lg", learnBackground: "paper" });
  });

  it("từng mục lạ hoặc dữ liệu hỏng về mặc định, mục hợp lệ còn lại được giữ", () => {
    expect(parseAppearance(JSON.stringify({ accent: "red", sentenceSize: "lg" }))).toEqual({
      accent: "violet",
      sentenceSize: "lg",
      learnBackground: "none",
    });
    expect(parseAppearance("{hỏng")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance("123")).toEqual(DEFAULT_APPEARANCE);
  });
});
