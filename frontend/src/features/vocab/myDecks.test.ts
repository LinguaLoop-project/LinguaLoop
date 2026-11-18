import { describe, expect, it } from "vitest";
import type { DeckApiError } from "./deckManageTypes";
import { myDeckFailure, sortMyDecks, validateMyDeckName, type MyDeck } from "./myDecks";

const apiError = (over: Partial<DeckApiError>): DeckApiError =>
  ({ kind: "unknown", status: null, message: null, fieldErrors: [], code: null, details: {}, ...over }) as DeckApiError;

describe("validateMyDeckName (BR-HT-25, AC-HT-57)", () => {
  it("accepts a name of 1 to 100 characters", () => {
    expect(validateMyDeckName("Từ vựng công sở")).toBeNull();
    expect(validateMyDeckName("a")).toBeNull();
    expect(validateMyDeckName("a".repeat(100))).toBeNull();
  });

  it("rejects an empty name or one made of spaces only", () => {
    expect(validateMyDeckName("")).toBe("NotBlank");
    expect(validateMyDeckName("   ")).toBe("NotBlank");
  });

  it("rejects a name longer than 100 characters after trimming, counting characters not code units", () => {
    expect(validateMyDeckName("a".repeat(101))).toBe("Size");
    expect(validateMyDeckName(`  ${"a".repeat(100)}  `)).toBeNull();
    expect(validateMyDeckName("😀".repeat(100))).toBeNull();
    expect(validateMyDeckName("😀".repeat(101))).toBe("Size");
  });
});

describe("myDeckFailure (AC-HT-57)", () => {
  it("puts a duplicate name (409) on the name field", () => {
    expect(myDeckFailure(apiError({ kind: "conflict", status: 409 }))).toEqual({ kind: "name", error: "Duplicate" });
  });

  it("puts a server-side name error on the name field", () => {
    const size = apiError({ kind: "validation", fieldErrors: [{ field: "name", code: "Size" }] });
    const blank = apiError({ kind: "validation", fieldErrors: [{ field: "name", code: "NotBlank" }] });
    expect(myDeckFailure(size)).toEqual({ kind: "name", error: "Size" });
    expect(myDeckFailure(blank)).toEqual({ kind: "name", error: "NotBlank" });
  });

  it("treats a missing deck as gone and a forbidden caller as forbidden", () => {
    expect(myDeckFailure(apiError({ kind: "notFound", status: 404 }))).toEqual({ kind: "gone" });
    expect(myDeckFailure(apiError({ kind: "forbidden", status: 403 }))).toEqual({ kind: "forbidden" });
  });

  it("keeps the typed name for a retry on network and server errors", () => {
    expect(myDeckFailure(apiError({ kind: "network" }))).toEqual({ kind: "retry" });
    expect(myDeckFailure(apiError({ kind: "server", status: 500 }))).toEqual({ kind: "retry" });
    expect(myDeckFailure(apiError({ kind: "validation", fieldErrors: [{ field: "other", code: "X" }] }))).toEqual({ kind: "retry" });
  });
});

describe("sortMyDecks", () => {
  const deck = (id: string, createdAt: string | null): MyDeck => ({ id, name: id, cardCount: 0, dueCount: 0, createdAt });

  it("puts the newest deck first and decks without a date last", () => {
    const sorted = sortMyDecks([deck("old", "2026-11-01T00:00:00Z"), deck("none", null), deck("new", "2026-11-18T00:00:00Z")]);
    expect(sorted.map((d) => d.id)).toEqual(["new", "old", "none"]);
  });
});
