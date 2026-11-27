import { describe, expect, it } from "vitest";
import { DEFAULT_PRACTICE_PREFS, mergeStored, parsePracticePrefs } from "./practicePrefs";

const none = { dictation: null, shadowing: null, watch: null };

describe("parsePracticePrefs (AC-TK-69)", () => {
  it("chưa lưu gì thì dùng mặc định của từng trang", () => {
    expect(parsePracticePrefs(none)).toEqual(DEFAULT_PRACTICE_PREFS);
  });

  it("đọc đúng giá trị đã lưu", () => {
    const prefs = parsePracticePrefs({
      dictation: JSON.stringify({ rate: 0.5, autoNext: true, showTranslation: false }),
      shadowing: JSON.stringify({ rate: "1", ipa: false, accent: "uk", vi: false }),
      watch: JSON.stringify({ rate: 1.5, ipa: true, translation: true }),
    });
    expect(prefs.dictation).toEqual({ rate: 0.5, autoNext: true, showTranslation: false });
    expect(prefs.shadowing).toEqual({ rate: "1", ipa: false, accent: "uk", vi: false });
    expect(prefs.watch).toEqual({ rate: 1.5, ipa: true, translation: true });
  });

  it("dữ liệu hỏng hoặc giá trị lạ về mặc định", () => {
    const prefs = parsePracticePrefs({
      dictation: "{hỏng",
      shadowing: JSON.stringify({ rate: "9", accent: "au", ipa: "yes" }),
      watch: JSON.stringify([1, 2]),
    });
    expect(prefs).toEqual(DEFAULT_PRACTICE_PREFS);
  });
});

describe("mergeStored (AC-TK-69)", () => {
  it("chỉ đổi trường được chỉnh, giữ trường khác", () => {
    const merged = JSON.parse(mergeStored(JSON.stringify({ rate: 0.75, hideVideo: true }), { rate: 1 }));
    expect(merged).toEqual({ rate: 1, hideVideo: true });
  });

  it("chưa có dữ liệu hoặc dữ liệu hỏng thì tạo mới", () => {
    expect(JSON.parse(mergeStored(null, { rate: 1 }))).toEqual({ rate: 1 });
    expect(JSON.parse(mergeStored("xx", { rate: 1 }))).toEqual({ rate: 1 });
  });
});
