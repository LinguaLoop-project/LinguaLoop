import { describe, expect, it } from "vitest";
import type { SavedWord } from "./types";
import { EMPTY_FILTER, filterSavedWords, findSaved, savedWordStats } from "./utils";

const word = (over: Partial<SavedWord>): SavedWord => ({
  id: "id",
  headword: "word",
  cefrLevel: "B1",
  pos: "noun",
  meaningNo: 1,
  translationVi: "từ",
  exampleEn: null,
  exampleVi: null,
  ipaUk: null,
  ipaUs: null,
  audioUk: null,
  audioUs: null,
  source: "dictionary",
  lesson: null,
  contextEn: null,
  contextVi: null,
  status: "new",
  nextReviewAt: null,
  due: true,
  savedAt: "2026-11-07T00:00:00Z",
  ...over,
});

const latte = word({ id: "1", headword: "latte", translationVi: "cà phê latte", source: "lesson", status: "new", due: true });
const borrow = word({ id: "2", headword: "borrow", translationVi: "mượn", status: "mastered", due: false });
const present = word({ id: "3", headword: "present", translationVi: "có mặt", status: "reviewing", due: false });
const items = [latte, borrow, present];

describe("findSaved", () => {
  it("tìm đúng nghĩa đã lưu của một mục từ, không nhầm nghĩa khác", () => {
    const second = word({ id: "4", headword: "present", meaningNo: 2 });
    expect(findSaved([present, second], "present", 2)).toBe(second);
    expect(findSaved([present], "present", 2)).toBeUndefined();
    expect(findSaved(undefined, "present", 1)).toBeUndefined();
  });
});

describe("filterSavedWords", () => {
  it("không lọc thì trả đủ", () => {
    expect(filterSavedWords(items, EMPTY_FILTER)).toEqual(items);
  });

  it("tìm theo từ hoặc nghĩa, không phân biệt hoa thường và khoảng trắng hai đầu", () => {
    expect(filterSavedWords(items, { ...EMPTY_FILTER, query: " LATTE " })).toEqual([latte]);
    expect(filterSavedWords(items, { ...EMPTY_FILTER, query: "mượn" })).toEqual([borrow]);
  });

  it("lọc theo nguồn", () => {
    expect(filterSavedWords(items, { ...EMPTY_FILTER, source: "lesson" })).toEqual([latte]);
    expect(filterSavedWords(items, { ...EMPTY_FILTER, source: "dictionary" })).toEqual([borrow, present]);
  });

  it("Đang học gồm mọi thẻ chưa thuộc; Đã thuộc và Đến hạn chọn đúng thẻ", () => {
    expect(filterSavedWords(items, { ...EMPTY_FILTER, state: "learning" })).toEqual([latte, present]);
    expect(filterSavedWords(items, { ...EMPTY_FILTER, state: "mastered" })).toEqual([borrow]);
    expect(filterSavedWords(items, { ...EMPTY_FILTER, state: "due" })).toEqual([latte]);
  });

  it("các điều kiện kết hợp với nhau (AC-VOCAB-08)", () => {
    expect(filterSavedWords(items, { query: "", source: "lesson", state: "mastered" })).toEqual([]);
    expect(filterSavedWords(items, { query: "", source: "lesson", state: "learning" })).toEqual([latte]);
  });
});

describe("savedWordStats", () => {
  it("đếm đã lưu, đến hạn, đang học và đã thuộc (AC-VOCAB-09)", () => {
    expect(savedWordStats(items)).toEqual({ total: 3, due: 1, learning: 2, mastered: 1 });
  });

  it("danh sách trống thì toàn số 0", () => {
    expect(savedWordStats([])).toEqual({ total: 0, due: 0, learning: 0, mastered: 0 });
  });
});
