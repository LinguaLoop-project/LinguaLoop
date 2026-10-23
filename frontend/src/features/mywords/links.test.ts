import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en/mywords.json";
import vi from "@/i18n/locales/vi/mywords.json";
import { deepLinkTarget } from "@/features/dictation/deepLink";
import type { DictationSentence } from "@/features/dictation/types";
import { practiceUrl } from "./links";

/** Đường dẫn khoá lá; bỏ hậu tố số nhiều (_one, _other) vì tiếng Việt không chia số nhiều. */
function leafPaths(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix.replace(/_(one|other)$/, "")];
  return Object.entries(node).flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key));
}

const sentence = (id: string, done: boolean): DictationSentence => ({
  id,
  sortOrder: 0,
  startMs: 0,
  endMs: 1000,
  wordCount: 3,
  text: done ? "Hello there." : null,
  textVi: null,
  latest: done
    ? { attemptId: 1, level: "hard", score: 40, gaveUp: false, retry: false, attemptedAt: "2026-10-24T00:00:00Z" }
    : null,
  inReview: done,
  note: null,
});

describe("practiceUrl", () => {
  it("mở bài nghe chép tại câu, thêm redo khi luyện lại", () => {
    expect(practiceUrl("ordering-coffee", "s1")).toBe("/student/dictation/ordering-coffee?sentence=s1");
    expect(practiceUrl("ordering-coffee", "s1", { redo: true })).toBe(
      "/student/dictation/ordering-coffee?sentence=s1&redo=1",
    );
  });

  it("mã hoá slug có ký tự đặc biệt", () => {
    expect(practiceUrl("a b", "s1")).toBe("/student/dictation/a%20b?sentence=s1");
  });
});

describe("deepLinkTarget", () => {
  const sentences = [sentence("a", false), sentence("b", true), sentence("c", true)];

  it("trả chỉ số câu và cờ làm lại", () => {
    expect(deepLinkTarget(sentences, new URLSearchParams("sentence=c&redo=1"))).toEqual({ index: 2, redo: true });
    expect(deepLinkTarget(sentences, new URLSearchParams("sentence=b"))).toEqual({ index: 1, redo: false });
  });

  it("không làm lại câu chưa có lượt nào", () => {
    expect(deepLinkTarget(sentences, new URLSearchParams("sentence=a&redo=1"))).toEqual({ index: 0, redo: false });
  });

  it("bỏ qua khi thiếu hoặc sai id câu", () => {
    expect(deepLinkTarget(sentences, new URLSearchParams(""))).toBeNull();
    expect(deepLinkTarget(sentences, new URLSearchParams("sentence=zzz&redo=1"))).toBeNull();
  });
});

describe("chuỗi giao diện Từ & câu đã lưu", () => {
  it("tiếng Việt và tiếng Anh có cùng bộ khoá", () => {
    expect([...new Set(leafPaths(en))].sort()).toEqual([...new Set(leafPaths(vi))].sort());
  });
});
