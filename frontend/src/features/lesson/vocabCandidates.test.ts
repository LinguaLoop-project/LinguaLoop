import { describe, expect, it, vi } from "vitest";
import type { SentenceResponse } from "./types";
import { compactIpa, extractCandidateWords, stemKey } from "./vocabCandidates";

// Chỉ cần hàm chuẩn hóa từ; tránh nạp cả giao diện của tính năng từ điển trong môi trường test không có DOM.
vi.mock("@/features/dictionary", () => import("@/features/dictionary/utils"));

const sentence = (id: string, textEn: string) => ({ id, textEn }) as SentenceResponse;

describe("stemKey", () => {
  it("AC_TC_LIB_16 gom các biến thể chia về cùng gốc", () => {
    expect(stemKey("studies")).toBe("study");
    expect(stemKey("running")).toBe("run");
    expect(stemKey("practiced")).toBe("practic");
    expect(stemKey("books")).toBe("books");
    expect(stemKey("walk")).toBe("walk");
  });
});

describe("extractCandidateWords", () => {
  it("AC_TC_LIB_17 đang tải thì chưa gợi ý gì", () => {
    expect(extractCandidateWords([sentence("a", "Beautiful mountains")], "", true)).toEqual([]);
  });

  it("AC_TC_LIB_18 bài chưa có câu thì dùng từ dự phòng", () => {
    const words = extractCandidateWords([]);
    expect(words.map((w) => w.word)).toEqual(["spelling", "improve", "practice"]);
  });

  it("AC_TC_LIB_19 bỏ tên riêng và từ quá phổ biến, gắn câu xuất hiện đầu tiên", () => {
    const words = extractCandidateWords([
      sentence("s1", "We met Emily near the beautiful harbour."),
      sentence("s2", "Because the harbour was quiet, we walked."),
    ]);
    const list = words.map((w) => w.word);
    expect(list).toContain("harbour");
    expect(list).toContain("beautiful");
    expect(list).not.toContain("emily");
    expect(list).not.toContain("because");
    expect(words.find((w) => w.word === "harbour")?.sentenceId).toBe("s1");
  });

  it("AC_TC_LIB_20 từ trong tiêu đề và từ lặp nhiều được xếp trước, tối đa 5 từ", () => {
    const words = extractCandidateWords(
      [
        sentence("s1", "Wonderful gardens grow tomatoes carrots potatoes cabbages."),
        sentence("s2", "Cabbages need water."),
      ],
      "Cabbages",
    );
    expect(words).toHaveLength(5);
    expect(words[0].word).toBe("cabbages");
  });

  it("AC_TC_LIB_21 không lấy hai biến thể của cùng một từ", () => {
    const words = extractCandidateWords([sentence("s1", "Studies about studied history continue studying history.")]);
    expect(words.filter((w) => w.word.startsWith("studi")).length).toBeLessThanOrEqual(1);
  });
});

describe("compactIpa", () => {
  it("AC_TC_LIB_22 lấy cách đọc đầu tiên và bọc lại bằng dấu gạch", () => {
    expect(compactIpa("/həˈləʊ/, /hɛˈləʊ/")).toBe("/həˈləʊ/");
    expect(compactIpa("wɜːd")).toBe("/wɜːd/");
    expect(compactIpa("")).toBeNull();
    expect(compactIpa(null)).toBeNull();
  });
});
