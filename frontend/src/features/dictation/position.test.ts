import { describe, expect, it } from "vitest";
import { followTarget, sentenceAt } from "./position";

const segments = [
  { startMs: 0, endMs: 2000 },
  { startMs: 3000, endMs: 5000 },
  { startMs: 6000, endMs: 8000 },
];

describe("sentenceAt", () => {
  it("lấy câu chứa mốc, kể cả sát biên", () => {
    expect(sentenceAt(segments, 0)).toBe(0);
    expect(sentenceAt(segments, 2000)).toBe(0);
    expect(sentenceAt(segments, 4000)).toBe(1);
    expect(sentenceAt(segments, 8000)).toBe(2);
  });

  it("mốc trong khoảng lặng lấy câu gần nhất", () => {
    expect(sentenceAt(segments, 2400)).toBe(0);
    expect(sentenceAt(segments, 2600)).toBe(1);
    expect(sentenceAt(segments, 5400)).toBe(1);
    expect(sentenceAt(segments, 5600)).toBe(2);
  });

  it("mốc ngoài hai đầu lấy câu đầu hoặc câu cuối", () => {
    expect(sentenceAt(segments, -500)).toBe(0);
    expect(sentenceAt(segments, 60000)).toBe(2);
  });
});

describe("followTarget", () => {
  it("chuyển tới câu chứa mốc khi khác câu hiện tại", () => {
    expect(followTarget(segments, 6500, 0, false)).toBe(2);
  });

  it("giữ nguyên khi mốc vẫn ở câu hiện tại", () => {
    expect(followTarget(segments, 3500, 1, false)).toBeNull();
  });

  it("giữ nguyên khi đang gõ dở dù mốc ở câu khác", () => {
    expect(followTarget(segments, 6500, 0, true)).toBeNull();
  });

  it("không có câu nào thì không đổi", () => {
    expect(followTarget([], 1000, 0, false)).toBeNull();
  });
});
