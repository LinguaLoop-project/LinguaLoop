import { describe, expect, it } from "vitest";
import type { MeaningGroup, Pronunciation, WordView } from "./types";
import { accentOrder, displayGroups, mainPronunciation, normalizeWord } from "./utils";

const pron = (ipaUs: string | null, ipaUk: string | null = null): Pronunciation => ({
  ipaUs,
  ipaUk,
  audioUs: null,
  audioUk: null,
});

const group = (pos: string, pronunciation: Pronunciation): MeaningGroup => ({
  pos,
  pronunciation,
  meanings: [{ no: 1, translationVi: "nghĩa", definitionEn: null, definitionVi: null, exampleEn: null, exampleVi: null }],
});

const view = (over: Partial<WordView>): WordView => ({
  headword: "word",
  pronunciation: pron("/w/"),
  groups: [],
  lemma: null,
  ...over,
});

describe("accentOrder", () => {
  it("giọng được chọn đứng trước, giọng còn lại theo sau", () => {
    expect(accentOrder("us")).toEqual(["us", "uk"]);
    expect(accentOrder("uk")).toEqual(["uk", "us"]);
  });
});

describe("mainPronunciation", () => {
  it("lấy phát âm của nhóm nghĩa đầu tiên (có thể ghi đè theo loại từ)", () => {
    const w = view({ pronunciation: pron("/default/"), groups: [group("verb", pron("/verb/")), group("noun", pron("/noun/"))] });
    expect(mainPronunciation(w).ipaUs).toBe("/verb/");
  });

  it("không có nghĩa riêng thì dùng phát âm của chính từ", () => {
    expect(mainPronunciation(view({ pronunciation: pron("/things/") })).ipaUs).toBe("/things/");
  });
});

describe("displayGroups", () => {
  it("từ có nghĩa riêng thì hiện nghĩa riêng, kể cả khi có từ gốc", () => {
    const own = [group("noun", pron("/a/"))];
    const w = view({ groups: own, lemma: view({ groups: [group("verb", pron("/b/"))] }) });
    expect(displayGroups(w)).toBe(own);
  });

  it("dạng chia không có nghĩa riêng thì hiện nghĩa của từ gốc", () => {
    const lemmaGroups = [group("noun", pron("/thing/"))];
    expect(displayGroups(view({ lemma: view({ groups: lemmaGroups }) }))).toBe(lemmaGroups);
  });

  it("không có nghĩa nào thì trả mảng rỗng", () => {
    expect(displayGroups(view({}))).toEqual([]);
  });
});

describe("normalizeWord", () => {
  it("bỏ dấu câu hai đầu, đổi chữ thường và dấu nháy cong về dấu nháy thẳng", () => {
    expect(normalizeWord("out,")).toBe("out");
    expect(normalizeWord("Don’t.")).toBe("don't");
    expect(normalizeWord("home.")).toBe("home");
  });

  it("chữ chỉ có dấu câu thì rỗng nên không tra", () => {
    expect(normalizeWord("-")).toBe("");
    expect(normalizeWord("...")).toBe("");
  });
});
