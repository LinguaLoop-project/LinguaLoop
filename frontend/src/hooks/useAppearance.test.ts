import { describe, expect, it } from "vitest";
import { ACCENTS, CORNER_STYLES, DEFAULT_APPEARANCE, LEARN_BACKGROUNDS, THEME_PRESETS, parseAppearance } from "./appearance";

describe("parseAppearance (AC-TK-70)", () => {
  it("chưa lưu gì thì dùng mặc định: tím, vừa, không nền, bo mềm, không giảm chuyển động", () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(DEFAULT_APPEARANCE).toEqual({
      accent: "violet",
      sentenceSize: "md",
      learnBackground: "none",
      cornerStyle: "rounded",
      reduceMotion: false,
    });
  });

  it("đọc đúng giá trị đã lưu bao gồm các tuỳ chọn mới và dữ liệu cũ", () => {
    const legacy = JSON.stringify({ accent: "pink", sentenceSize: "lg", learnBackground: "paper" });
    expect(parseAppearance(legacy)).toEqual({
      accent: "pink",
      sentenceSize: "lg",
      learnBackground: "paper",
      cornerStyle: "rounded",
      reduceMotion: false,
    });

    const full = JSON.stringify({
      accent: "amber",
      sentenceSize: "md",
      learnBackground: "gradient",
      cornerStyle: "sharp",
      reduceMotion: true,
    });
    expect(parseAppearance(full)).toEqual({
      accent: "amber",
      sentenceSize: "md",
      learnBackground: "gradient",
      cornerStyle: "sharp",
      reduceMotion: true,
    });
  });

  it("từng mục lạ hoặc dữ liệu hỏng về mặc định, mục hợp lệ còn lại được giữ", () => {
    expect(
      parseAppearance(JSON.stringify({ accent: "red", sentenceSize: "lg", cornerStyle: "pill", reduceMotion: "yes" })),
    ).toEqual({
      accent: "violet",
      sentenceSize: "lg",
      learnBackground: "none",
      cornerStyle: "rounded",
      reduceMotion: false,
    });
    expect(parseAppearance("{hỏng")).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance("123")).toEqual(DEFAULT_APPEARANCE);
  });

  it("mọi gói giao diện nhanh đều dùng giá trị hợp lệ", () => {
    for (const preset of THEME_PRESETS) {
      expect(ACCENTS).toContain(preset.accent);
      expect(LEARN_BACKGROUNDS).toContain(preset.learnBackground);
      expect(CORNER_STYLES).toContain(preset.cornerStyle);
    }
    expect(LEARN_BACKGROUNDS).toEqual(["none", "paper", "gradient", "aurora", "dots", "grid"]);
    expect(parseAppearance(JSON.stringify({ learnBackground: "aurora" })).learnBackground).toBe("aurora");
    expect(parseAppearance(JSON.stringify({ learnBackground: "dots" })).learnBackground).toBe("dots");
    expect(parseAppearance(JSON.stringify({ learnBackground: "grid" })).learnBackground).toBe("grid");
  });
});
