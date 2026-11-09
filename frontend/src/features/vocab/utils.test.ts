import { describe, expect, it } from "vitest";
import type { DeckPart, DeckSummary, SavedWord } from "./types";
import {
  EMPTY_FILTER,
  EMPTY_DECK_FILTER,
  OTHER_CATEGORY,
  deckUrl,
  filterDecks,
  filterSavedWords,
  findSaved,
  groupByCategory,
  isDeckFilterActive,
  isStarted,
  learnedCount,
  nextPartIndex,
  partState,
  partUrl,
  percentOf,
  savedWordStats,
  visibleParts,
} from "./utils";

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

  it("các điều kiện kết hợp với nhau (AC-HT-50)", () => {
    expect(filterSavedWords(items, { query: "", source: "lesson", state: "mastered" })).toEqual([]);
    expect(filterSavedWords(items, { query: "", source: "lesson", state: "learning" })).toEqual([latte]);
  });
});

describe("savedWordStats", () => {
  it("đếm đã lưu, đến hạn, đang học và đã thuộc (AC-HT-51)", () => {
    expect(savedWordStats(items)).toEqual({ total: 3, due: 1, learning: 2, mastered: 1 });
  });

  it("danh sách trống thì toàn số 0", () => {
    expect(savedWordStats([])).toEqual({ total: 0, due: 0, learning: 0, mastered: 0 });
  });
});

const part = (over: Partial<DeckPart>): DeckPart => ({
  index: 0,
  name: "Part 1",
  nameVi: "Phần 1",
  cardCount: 20,
  studiedCount: 0,
  locked: false,
  ...over,
});

describe("nextPartIndex", () => {
  it("là phần đầu tiên còn thẻ Mới (AC-HT-05)", () => {
    const parts = [part({ index: 0, studiedCount: 20 }), part({ index: 1, studiedCount: 15 }), part({ index: 2 })];
    expect(nextPartIndex(parts)).toBe(1);
  });

  it("bỏ qua phần bị khoá", () => {
    const parts = [part({ index: 0, studiedCount: 20 }), part({ index: 1, locked: true }), part({ index: 2, locked: true })];
    expect(nextPartIndex(parts)).toBeNull();
  });

  it("null khi bộ không có phần nào hoặc đã học hết", () => {
    expect(nextPartIndex([])).toBeNull();
    expect(nextPartIndex([part({ studiedCount: 20 })])).toBeNull();
  });
});

describe("partState", () => {
  it("khoá, xong, đang học và chưa học", () => {
    expect(partState(part({ locked: true }), 0)).toBe("locked");
    expect(partState(part({ studiedCount: 20 }), 3)).toBe("done");
    expect(partState(part({ index: 3, studiedCount: 5 }), 3)).toBe("current");
    expect(partState(part({ index: 4 }), 3)).toBe("todo");
  });

  it("phần không có thẻ nào không tính là đã xong", () => {
    expect(partState(part({ cardCount: 0, studiedCount: 0 }), null)).toBe("todo");
  });
});

describe("tiến độ bộ", () => {
  const deck: DeckSummary = {
    id: "d",
    slug: "oxford-a1",
    name: "Oxford A1",
    nameVi: null,
    cefrLevel: "A1",
    pro: false,
    thumbnailUrl: null,
    category: null,
    cardCount: 100,
    groupCount: 5,
    progress: { mastered: 10, reviewing: 5, learning: 5, newCount: 80 },
    dueCount: 0,
  };

  it("đếm thẻ đã học và phần trăm", () => {
    expect(learnedCount(deck.progress)).toBe(20);
    expect(percentOf(20, 100)).toBe(20);
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(5, 0)).toBe(0);
  });

  it("bộ đã học ít nhất một thẻ thì đang học", () => {
    expect(isStarted(deck)).toBe(true);
    expect(isStarted({ ...deck, progress: { mastered: 0, reviewing: 0, learning: 0, newCount: 100 } })).toBe(false);
  });

  it("đường dẫn phần tính từ 1", () => {
    expect(deckUrl("oxford-a1")).toBe("/student/vocab/oxford-a1");
    expect(partUrl("oxford-a1", 0)).toBe("/student/vocab/oxford-a1/parts/1");
    expect(partUrl("oxford-a1", 4)).toBe("/student/vocab/oxford-a1/parts/5");
  });
});

describe("groupByCategory", () => {
  const base: DeckSummary = {
    id: "d",
    slug: "x",
    name: "X",
    nameVi: null,
    cefrLevel: null,
    pro: false,
    thumbnailUrl: null,
    category: null,
    cardCount: 1,
    groupCount: 1,
    progress: { mastered: 0, reviewing: 0, learning: 0, newCount: 1 },
    dueCount: 0,
  };
  const deck = (slug: string, category: string | null): DeckSummary => ({
    ...base,
    slug,
    category: category ? { slug: category, name: category, nameVi: null } : null,
  });

  it("gom bộ theo danh mục, giữ thứ tự xuất hiện", () => {
    const groups = groupByCategory([deck("a", "oxford"), deck("b", "toeic"), deck("c", "oxford")]);
    expect(groups.map((g) => g.category?.slug)).toEqual(["oxford", "toeic"]);
    expect(groups[0].decks.map((d) => d.slug)).toEqual(["a", "c"]);
  });

  it("bộ không có danh mục xếp cuối", () => {
    const groups = groupByCategory([deck("a", null), deck("b", "oxford")]);
    expect(groups.map((g) => g.category?.slug ?? null)).toEqual(["oxford", null]);
  });

  it("không có bộ thì không có nhóm", () => {
    expect(groupByCategory([])).toEqual([]);
  });
});

describe("filterDecks", () => {
  const make = (slug: string, name: string, over: Partial<DeckSummary> = {}): DeckSummary => ({
    id: slug,
    slug,
    name,
    nameVi: null,
    cefrLevel: "A1",
    pro: false,
    thumbnailUrl: null,
    category: { slug: "oxford", name: "Oxford", nameVi: "Từ Vựng Oxford" },
    cardCount: 10,
    groupCount: 1,
    progress: { mastered: 0, reviewing: 0, learning: 0, newCount: 10 },
    dueCount: 0,
    ...over,
  });
  const oxford = make("oxford-a1", "3000 Oxford Vocabulary A1", { nameVi: "Từ Vựng Oxford 3000 A1" });
  const toeic = make("toeic-600", "600 essential words for the TOEIC", {
    nameVi: "600 từ vựng thiết yếu cho TOEIC",
    category: { slug: "toeic", name: "TOEIC Vocabulary", nameVi: "Từ Vựng TOEIC" },
    cefrLevel: "B1",
    progress: { mastered: 0, reviewing: 0, learning: 3, newCount: 7 },
  });
  const decks = [oxford, toeic];

  it("không lọc thì trả đủ và không tính là đang lọc", () => {
    expect(filterDecks(decks, EMPTY_DECK_FILTER)).toEqual(decks);
    expect(isDeckFilterActive(EMPTY_DECK_FILTER)).toBe(false);
    expect(isDeckFilterActive({ ...EMPTY_DECK_FILTER, query: "  " })).toBe(false);
    expect(isDeckFilterActive({ ...EMPTY_DECK_FILTER, level: "B1" })).toBe(true);
  });

  it("tìm theo tên bộ hoặc tên danh mục, không phân biệt hoa thường", () => {
    expect(filterDecks(decks, { ...EMPTY_DECK_FILTER, query: " toeic " })).toEqual([toeic]);
    expect(filterDecks(decks, { ...EMPTY_DECK_FILTER, query: "oxford" })).toEqual([oxford]);
  });

  it("gõ không dấu vẫn tìm ra chữ có dấu", () => {
    expect(filterDecks(decks, { ...EMPTY_DECK_FILTER, query: "thiet yeu" })).toEqual([toeic]);
    expect(filterDecks(decks, { ...EMPTY_DECK_FILTER, query: "tu vung oxford" })).toEqual([oxford]);
  });

  it("lọc theo danh mục, mức CEFR và tình trạng học", () => {
    expect(filterDecks(decks, { ...EMPTY_DECK_FILTER, category: "toeic" })).toEqual([toeic]);
    expect(filterDecks(decks, { ...EMPTY_DECK_FILTER, level: "A1" })).toEqual([oxford]);
    expect(filterDecks(decks, { ...EMPTY_DECK_FILTER, state: "learning" })).toEqual([toeic]);
    expect(filterDecks(decks, { ...EMPTY_DECK_FILTER, state: "new" })).toEqual([oxford]);
  });

  it("lọc mục Khác gồm các bộ không có danh mục (BR-BT-14)", () => {
    const loose = make("loose", "Loose deck", { category: null });
    expect(filterDecks([...decks, loose], { ...EMPTY_DECK_FILTER, category: OTHER_CATEGORY })).toEqual([loose]);
    expect(filterDecks([...decks, loose], { ...EMPTY_DECK_FILTER, category: "toeic" })).toEqual([toeic]);
  });

  it("các điều kiện kết hợp với nhau", () => {
    expect(filterDecks(decks, { query: "oxford", category: "oxford", state: "learning", level: "all" })).toEqual([]);
    expect(filterDecks(decks, { query: "600", category: "toeic", state: "learning", level: "B1" })).toEqual([toeic]);
  });
});

describe("visibleParts", () => {
  const many = (count: number, over: (i: number) => Partial<DeckPart> = () => ({})) =>
    Array.from({ length: count }, (_, i) => part({ index: i, ...over(i) }));

  it("bộ ít phần thì hiện hết", () => {
    const parts = many(6);
    expect(visibleParts(parts, 3, false)).toEqual({ items: parts, from: 0, to: 6 });
  });

  it("bộ nhiều phần thì hiện cửa sổ 8 phần quanh phần đang học", () => {
    const result = visibleParts(many(100), 40, false);
    expect(result.items.map((p) => p.index)).toEqual([38, 39, 40, 41, 42, 43, 44, 45]);
    expect([result.from, result.to]).toEqual([38, 46]);
  });

  it("cửa sổ không vượt đầu và cuối bộ", () => {
    expect(visibleParts(many(100), 0, false).from).toBe(0);
    expect(visibleParts(many(100), 99, false)).toMatchObject({ from: 92, to: 100 });
  });

  it("hết phần để học thì neo vào phần khoá đầu tiên", () => {
    const parts = many(100, (i) => (i >= 2 ? { locked: true } : { studiedCount: 20 }));
    expect(visibleParts(parts, null, false).items[0].index).toBe(0);
    const later = many(100, (i) => (i >= 50 ? { locked: true } : { studiedCount: 20 }));
    expect(visibleParts(later, null, false)).toMatchObject({ from: 48, to: 56 });
  });

  it("chọn xem tất cả thì hiện hết", () => {
    expect(visibleParts(many(100), 40, true).items).toHaveLength(100);
  });
});
