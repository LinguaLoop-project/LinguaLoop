import { describe, expect, it } from "vitest";
import {
  conflictsOf,
  errorMessageKey,
  listState,
  ownerIdsOf,
  parsePreselect,
  preselectPath,
  selectionSummary,
  validateLockReason,
} from "./adminUsers";
import type { AdminApiError, TransferItem } from "./types";

const error = (patch: Partial<AdminApiError>): AdminApiError => ({
  kind: "conflict",
  status: 409,
  code: null,
  message: null,
  fieldErrors: [],
  details: {},
  ...patch,
});

const item = (patch: Partial<TransferItem>): TransferItem => ({
  type: "lesson",
  id: "1",
  name: "Bài",
  ownerId: "t1",
  ownerName: "Lê Thanh",
  lockedAt: null,
  openReports: 0,
  ...patch,
});

describe("validateLockReason (BR-QT-03)", () => {
  it("requires a reason (AC-QT-10)", () => {
    expect(validateLockReason("   ")).toBe("NotBlank");
  });

  it("rejects 501 characters and accepts 500 (AC-QT-47)", () => {
    expect(validateLockReason("a".repeat(501))).toBe("Size");
    expect(validateLockReason("a".repeat(500))).toBeNull();
  });
});

describe("listState", () => {
  it("separates empty list from filtered no-result (AC-QT-04, AC-QT-28, AC-QT-51)", () => {
    expect(listState({ isLoading: false, isError: false, count: 0, filtered: false })).toBe("empty");
    expect(listState({ isLoading: false, isError: false, count: 0, filtered: true })).toBe("noResult");
    expect(listState({ isLoading: true, isError: false, filtered: false })).toBe("loading");
    expect(listState({ isLoading: false, isError: false, count: 3, filtered: true })).toBe("list");
  });
});

describe("errorMessageKey", () => {
  it("uses the business code, or the retry message when the connection is lost (AC-QT-12)", () => {
    expect(errorMessageKey(error({ code: "USER_ALREADY_LOCKED" }), "lock.failed")).toBe("errors.USER_ALREADY_LOCKED");
    expect(errorMessageKey(error({ kind: "network", status: null }), "lock.failed")).toBe("lock.failed");
  });
});

describe("transfer selection", () => {
  it("summarises lessons, decks and current owners (UC-QT-06 Bước 5)", () => {
    const summary = selectionSummary([
      item({ id: "1" }),
      item({ id: "2" }),
      item({ id: "3", type: "deck", ownerId: null, ownerName: null }),
    ]);
    expect(summary).toEqual({ lessons: 2, decks: 1, owners: ["Lê Thanh", null] });
  });

  it("excludes current owners from recipients, ignoring system decks (BR-QT-06)", () => {
    expect(ownerIdsOf([item({ ownerId: "b" }), item({ ownerId: "a" }), item({ ownerId: null }), item({ ownerId: "a" })]))
      .toEqual(["a", "b"]);
  });

  it("reads name conflicts from error details (AC-QT-35)", () => {
    const conflicts = [{ type: "deck", id: "d", name: "toeic essential 1000" }];
    expect(conflictsOf(error({ details: { conflicts } }))).toEqual(conflicts);
    expect(conflictsOf(error({}))).toEqual([]);
  });

  it("round-trips a preselected system deck from a report (AC-QT-46)", () => {
    const path = preselectPath({ type: "deck", id: "d1", name: "Oxford 3000", ownerId: null, ownerName: null });
    const parsed = parsePreselect(new URLSearchParams(path.split("?")[1]));
    expect(parsed).toMatchObject({ type: "deck", id: "d1", name: "Oxford 3000", ownerId: null });
    expect(parsePreselect(new URLSearchParams("assignType=video&assignId=x"))).toBeNull();
  });
});
