import { describe, expect, it } from "vitest";
import { activeLineIndex, activeWordIndex, buildEntries, estimateWordEnds } from "./feed";
import { DEFAULT_PREFS, parsePrefs } from "./prefs";
import type { WatchItem, WatchLine } from "./types";

const line = (startMs: number, endMs: number): WatchLine => ({
  id: `s${startMs}`,
  textEn: "x",
  textVi: null,
  ipaUs: null,
  ipaUk: null,
  startMs,
  endMs,
  saved: false,
});

const video = (id: string): WatchItem => ({
  lessonId: id,
  title: id,
  youtubeId: "abc",
  durationSec: 60,
  cefrLevel: "A1",
  topicName: null,
  pro: false,
  likeCount: 0,
  liked: false,
  sentences: [],
});

describe("buildEntries (AC-TC-32)", () => {
  const items = Array.from({ length: 12 }, (_, i) => video(`v${i}`));

  it("không chèn thẻ mời khi không có video Pro bị ẩn", () => {
    expect(buildEntries(items, false).filter((e) => e.kind === "upsell")).toHaveLength(0);
  });

  it("chèn một thẻ mời sau mỗi 10 video khi có video Pro bị ẩn", () => {
    const entries = buildEntries(items, true);
    expect(entries).toHaveLength(13);
    expect(entries[10].kind).toBe("upsell");
    expect(entries.filter((e) => e.kind === "upsell")).toHaveLength(1);
  });

  it("giữ nguyên thứ tự video", () => {
    const ids = buildEntries(items, true).flatMap((e) => (e.kind === "video" ? [e.item.lessonId] : []));
    expect(ids).toEqual(items.map((i) => i.lessonId));
  });
});

describe("activeLineIndex (AC-TC-25)", () => {
  const lines = [line(1000, 1900), line(3000, 3900), line(5000, 5900)];

  it("trước câu đầu không có câu nào", () => {
    expect(activeLineIndex(lines, 500)).toBe(-1);
  });

  it("đang trong câu thì là câu đó", () => {
    expect(activeLineIndex(lines, 3500)).toBe(1);
  });

  it("trong khoảng lặng giữa hai câu vẫn là câu vừa nói xong", () => {
    expect(activeLineIndex(lines, 2500)).toBe(0);
  });

  it("sau câu cuối vẫn là câu cuối", () => {
    expect(activeLineIndex(lines, 99_000)).toBe(2);
  });

  it("danh sách rỗng", () => {
    expect(activeLineIndex([], 1000)).toBe(-1);
  });
});

describe("tô sáng từ ước lượng", () => {
  const words = ["I", "have", "been", "working"];
  const sentence = { startMs: 1000, endMs: 3000 };

  it("mốc kết thúc tăng dần và từ cuối kết thúc đúng cuối câu", () => {
    const ends = estimateWordEnds(words, 2000);
    expect(ends).toEqual([...ends].sort((a, b) => a - b));
    expect(ends.at(-1)).toBe(2000);
  });

  it("từ dài được nhiều thời gian hơn từ ngắn", () => {
    const ends = estimateWordEnds(["a", "extraordinary"], 1000);
    expect(ends[0]).toBeLessThan(1000 - ends[0]);
  });

  it("đầu câu là từ đầu, cuối câu là từ cuối", () => {
    expect(activeWordIndex(words, sentence, 1000)).toBe(0);
    expect(activeWordIndex(words, sentence, 2990)).toBe(3);
  });

  it("ngoài thời gian của câu thì không tô từ nào", () => {
    expect(activeWordIndex(words, sentence, 500)).toBe(-1);
    expect(activeWordIndex(words, sentence, 3000)).toBe(-1);
    expect(activeWordIndex([], sentence, 1500)).toBe(-1);
  });
});

describe("parsePrefs (AC-TC-26, BR-TC-15)", () => {
  it("không có gì đã lưu thì dùng mặc định", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
  });

  it("đọc lại tốc độ 0,75 và phụ đề tắt", () => {
    const prefs = parsePrefs(JSON.stringify({ ...DEFAULT_PREFS, rate: 0.75, captions: false }));
    expect(prefs.rate).toBe(0.75);
    expect(prefs.captions).toBe(false);
  });

  it("giá trị hỏng chỉ rơi về mặc định ở mục hỏng", () => {
    const prefs = parsePrefs(JSON.stringify({ rate: 3, captions: "yes", translation: true, size: "xl" }));
    expect(prefs).toEqual({ ...DEFAULT_PREFS, translation: true });
  });

  it("chuỗi không phải JSON thì dùng mặc định", () => {
    expect(parsePrefs("{oops")).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("123")).toEqual(DEFAULT_PREFS);
  });
});
