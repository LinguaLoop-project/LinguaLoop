import { describe, expect, it } from "vitest";
import { chipTone, formatClock, normalizeWord, outcomeTone, practiced, sentenceTokens } from "./utils";
import type { WordView } from "./types";

const view = (patch: Partial<WordView>): WordView => ({
  word: "things",
  phoneme: "θ",
  baseline: 54,
  attempts: 0,
  status: "pending",
  ...patch,
});

describe("formatClock", () => {
  it("đổi giây sang phút:giây", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(134)).toBe("2:14");
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(-5)).toBe("0:00");
  });
});

describe("sentenceTokens", () => {
  it("bỏ dấu câu quanh từ, giữ dấu nháy đơn, bỏ phần chỉ có dấu câu", () => {
    expect(sentenceTokens(`If things don't work out, - "you" ...`)).toEqual([
      { text: "If", key: "if" },
      { text: "things", key: "things" },
      { text: "don't", key: "don't" },
      { text: "work", key: "work" },
      { text: "out", key: "out" },
      { text: "you", key: "you" },
    ]);
  });

  it("khớp cách chuẩn hoá của backend", () => {
    expect(normalizeWord("Don't,")).toBe("don't");
    expect(normalizeWord("it's!")).toBe("it's");
  });
});

describe("chipTone", () => {
  it("theo trạng thái từ trong phiên", () => {
    expect(chipTone(undefined)).toBe("none");
    expect(chipTone(view({}))).toBe("bad");
    expect(chipTone(view({ attempts: 1 }))).toBe("try");
    expect(chipTone(view({ attempts: 2, status: "passed" }))).toBe("ok");
    expect(chipTone(view({ attempts: 3, status: "needs_practice" }))).toBe("warn");
  });
});

describe("practiced và outcomeTone", () => {
  it("chỉ lấy từ đã luyện", () => {
    const words = [view({ word: "a" }), view({ word: "b", attempts: 1 }), view({ word: "c", best: 70 })];
    expect(practiced(words).map((w) => w.word)).toEqual(["b", "c"]);
  });

  it("giọng điệu theo lý do kết thúc", () => {
    expect(outcomeTone("completed")).toBe("ok");
    expect(outcomeTone("connect_failed")).toBe("bad");
    expect(outcomeTone("learner_exit")).toBe("neutral");
    expect(outcomeTone("idle")).toBe("warn");
    expect(outcomeTone("timeout")).toBe("warn");
    expect(outcomeTone("off_topic")).toBe("warn");
  });
});
