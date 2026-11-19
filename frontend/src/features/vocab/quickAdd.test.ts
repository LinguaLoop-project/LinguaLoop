import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckApiError, DeckCard } from "./deckManageTypes";

const content = vi.hoisted(() => ({ addGroup: vi.fn(), deleteGroup: vi.fn() }));
const decks = vi.hoisted(() => ({ create: vi.fn(), remove: vi.fn(), addFromDictionary: vi.fn() }));
vi.mock("./deckContentApi", () => ({ deckContentApi: content }));
vi.mock("./myDecksApi", () => ({ myDecksApi: decks }));

import {
  NEW_OPTION,
  QuickAddError,
  loadLastChoice,
  pickDeckId,
  pickGroupId,
  quickAddFailure,
  runQuickAdd,
  saveLastChoice,
} from "./quickAdd";

const apiError = (over: Partial<DeckApiError>): DeckApiError =>
  ({ kind: "unknown", status: null, message: null, fieldErrors: [], code: null, details: {}, ...over }) as DeckApiError;
const card = { id: "c1", word: "invoice" } as DeckCard;

beforeEach(() => {
  vi.clearAllMocks();
  decks.remove.mockResolvedValue(undefined);
  content.deleteGroup.mockResolvedValue(undefined);
});

describe("pickDeckId and pickGroupId (UC-HT-10, Q2)", () => {
  it("prefers the last used deck, then the first deck, then a new deck", () => {
    const list = [{ id: "a" }, { id: "b" }];
    expect(pickDeckId(list, "b")).toBe("b");
    expect(pickDeckId(list, "gone")).toBe("a");
    expect(pickDeckId([], "b")).toBe(NEW_OPTION);
  });

  it("prefers the last used group, then the last group of the deck, then a new group", () => {
    const list = [{ id: "g1" }, { id: "g2" }];
    expect(pickGroupId(list, "g1")).toBe("g1");
    expect(pickGroupId(list, "gone")).toBe("g2");
    expect(pickGroupId([], null)).toBe(NEW_OPTION);
  });
});

describe("last choice storage", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("remembers the choice per learner", () => {
    saveLastChoice("u1", { deckId: "d", groupId: "g" });
    expect(loadLastChoice("u1")).toEqual({ deckId: "d", groupId: "g" });
    expect(loadLastChoice("u2")).toBeNull();
    expect(loadLastChoice(undefined)).toBeNull();
  });

  it("ignores corrupt data", () => {
    store.set("ll.quickAdd.u1", "{oops");
    expect(loadLastChoice("u1")).toBeNull();
    store.set("ll.quickAdd.u1", JSON.stringify({ deckId: 3 }));
    expect(loadLastChoice("u1")).toBeNull();
  });
});

describe("runQuickAdd (BR-HT-28)", () => {
  it("adds straight to an existing deck and group", async () => {
    decks.addFromDictionary.mockResolvedValue(card);
    const result = await runQuickAdd({ headword: "invoice", meaningNo: 1, deck: { id: "d" }, group: { id: "g" } });
    expect(result).toEqual({ deckId: "d", groupId: "g", card });
    expect(decks.addFromDictionary).toHaveBeenCalledWith("d", "g", { headword: "invoice", meaningNo: 1, sentenceId: undefined });
    expect(decks.create).not.toHaveBeenCalled();
    expect(content.addGroup).not.toHaveBeenCalled();
  });

  it("creates the deck and the group first when they are new and passes the lesson sentence", async () => {
    decks.create.mockResolvedValue({ id: "nd" });
    content.addGroup.mockResolvedValue({ id: "ng" });
    decks.addFromDictionary.mockResolvedValue(card);
    const result = await runQuickAdd({
      headword: "invoice",
      meaningNo: 2,
      sentenceId: "s1",
      deck: { newName: "Công sở" },
      group: { newName: "Từ mới" },
    });
    expect(result.deckId).toBe("nd");
    expect(result.groupId).toBe("ng");
    expect(decks.create).toHaveBeenCalledWith("Công sở");
    expect(content.addGroup).toHaveBeenCalledWith("nd", "Từ mới", "learner");
    expect(decks.addFromDictionary).toHaveBeenCalledWith("nd", "ng", { headword: "invoice", meaningNo: 2, sentenceId: "s1" });
  });

  it("removes the group it just created when the word is already in the deck", async () => {
    content.addGroup.mockResolvedValue({ id: "ng" });
    decks.addFromDictionary.mockRejectedValue(apiError({ kind: "conflict", code: "VOCAB_CARD_WORD_TAKEN" }));
    await expect(
      runQuickAdd({ headword: "invoice", meaningNo: 1, deck: { id: "d" }, group: { newName: "Từ mới" } }),
    ).rejects.toBeInstanceOf(QuickAddError);
    expect(content.deleteGroup).toHaveBeenCalledWith("d", "ng", "learner");
    expect(decks.remove).not.toHaveBeenCalled();
  });

  it("removes the deck it just created when adding the card fails", async () => {
    decks.create.mockResolvedValue({ id: "nd" });
    content.addGroup.mockResolvedValue({ id: "ng" });
    decks.addFromDictionary.mockRejectedValue(apiError({ kind: "notFound", code: "VOCAB_MEANING_NOT_FOUND" }));
    await expect(
      runQuickAdd({ headword: "invoice", meaningNo: 1, deck: { newName: "Công sở" }, group: { newName: "Từ mới" } }),
    ).rejects.toBeInstanceOf(QuickAddError);
    expect(decks.remove).toHaveBeenCalledWith("nd");
  });

  it("keeps an existing group untouched when adding fails and reports the failing stage", async () => {
    decks.addFromDictionary.mockRejectedValue(apiError({ kind: "network" }));
    const error = await runQuickAdd({ headword: "x", meaningNo: 1, deck: { id: "d" }, group: { id: "g" } }).catch((e) => e);
    expect(error).toBeInstanceOf(QuickAddError);
    expect((error as QuickAddError).stage).toBe("card");
    expect(content.deleteGroup).not.toHaveBeenCalled();
    expect(decks.remove).not.toHaveBeenCalled();
  });

  it("stops at the deck step when the deck name is taken", async () => {
    decks.create.mockRejectedValue(apiError({ kind: "conflict" }));
    const error = await runQuickAdd({ headword: "x", meaningNo: 1, deck: { newName: "A" }, group: { newName: "B" } }).catch((e) => e);
    expect((error as QuickAddError).stage).toBe("deck");
    expect(content.addGroup).not.toHaveBeenCalled();
  });
});

describe("quickAddFailure (AC-HT-73, AC-HT-74)", () => {
  const at = (stage: "deck" | "group" | "card", error: DeckApiError) => quickAddFailure(new QuickAddError(stage, error));

  it("names the group that already holds the word", () => {
    const error = apiError({ kind: "conflict", code: "VOCAB_CARD_WORD_TAKEN", details: { groupName: "Văn phòng" } });
    expect(at("card", error)).toEqual({ kind: "taken", groupName: "Văn phòng" });
  });

  it("maps a missing meaning, a forbidden lesson and a missing deck", () => {
    expect(at("card", apiError({ kind: "notFound", code: "VOCAB_MEANING_NOT_FOUND" }))).toEqual({ kind: "meaningGone" });
    expect(at("card", apiError({ kind: "forbidden" }))).toEqual({ kind: "forbidden" });
    expect(at("card", apiError({ kind: "notFound", code: "VOCAB_DECK_NOT_FOUND" }))).toEqual({ kind: "gone" });
  });

  it("puts deck and group name errors on their own field", () => {
    expect(at("deck", apiError({ kind: "conflict" }))).toEqual({ kind: "deckName", error: "Duplicate" });
    expect(at("group", apiError({ kind: "conflict", code: "VOCAB_GROUP_NAME_TAKEN" }))).toEqual({ kind: "groupName", error: "Duplicate" });
    expect(at("group", apiError({ kind: "validation", fieldErrors: [{ field: "name", code: "Size" }] }))).toEqual({
      kind: "groupName",
      error: "Size",
    });
  });

  it("asks to retry on network and unknown errors", () => {
    expect(at("card", apiError({ kind: "network" }))).toEqual({ kind: "retry" });
    expect(quickAddFailure(new Error("boom"))).toEqual({ kind: "retry" });
  });
});
