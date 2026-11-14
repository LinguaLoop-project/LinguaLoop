import { describe, expect, it, vi } from "vitest";
import {
  ATTACH_BATCH,
  EMPTY_CARD,
  attachImagesInBatches,
  formatIpa,
  splitByWord,
  cardValuesFromDictionary,
  contentFailure,
  hasCardContent,
  importFailure,
  toCardInput,
  validateCard,
  validateGroupName,
  validateImportFile,
  type CardFormValues,
} from "./deckContentForm";
import type { DeckApiError } from "./deckManageTypes";

const apiError = (over: Partial<DeckApiError>): DeckApiError => ({
  kind: "unknown",
  status: null,
  message: null,
  fieldErrors: [],
  ...over,
});

describe("validateGroupName (BR-NT-02)", () => {
  it("rejects blank and whitespace-only names (AC-NT-05)", () => {
    expect(validateGroupName("")).toBe("NotBlank");
    expect(validateGroupName("   ")).toBe("NotBlank");
  });

  it("counts length after trimming, max 100", () => {
    expect(validateGroupName(`  ${"a".repeat(100)}  `)).toBeNull();
    expect(validateGroupName("a".repeat(101))).toBe("Size");
  });
});

describe("validateCard (BR-NT-03)", () => {
  const valid: CardFormValues = { ...EMPTY_CARD, word: "sustain", meaningVi: "duy trì" };

  it("requires word and Vietnamese meaning (AC-NT-29)", () => {
    expect(validateCard({ ...valid, word: "  " })).toEqual({ word: "NotBlank" });
    expect(validateCard({ ...valid, meaningVi: "" })).toEqual({ meaningVi: "NotBlank" });
  });

  it("limits word and IPA to 100, other texts to 500", () => {
    expect(validateCard({ ...valid, word: "a".repeat(101) })).toEqual({ word: "Size" });
    expect(validateCard({ ...valid, ipaUs: "a".repeat(101) })).toEqual({ ipaUs: "Size" });
    expect(validateCard({ ...valid, definitionVi: "a".repeat(500) })).toEqual({});
    expect(validateCard({ ...valid, exampleEn: "a".repeat(501) })).toEqual({ exampleEn: "Size" });
  });

  it("accepts only part-of-speech codes of the card list", () => {
    expect(validateCard({ ...valid, pos: "phrasal verb" })).toEqual({});
    expect(validateCard({ ...valid, pos: "abbreviation" })).toEqual({ pos: "Pattern" });
  });
});

describe("toCardInput", () => {
  it("trims values and sends empty optional fields as null", () => {
    expect(toCardInput({ ...EMPTY_CARD, word: " sustain ", meaningVi: "duy trì ", ipaUk: "  ", pos: "verb" })).toEqual({
      word: "sustain",
      meaningVi: "duy trì",
      ipaUk: null,
      ipaUs: null,
      pos: "verb",
      definitionEn: null,
      definitionVi: null,
      exampleEn: null,
      exampleVi: null,
    });
  });
});

describe("cardValuesFromDictionary (BR-NT-08)", () => {
  const choice = {
    headword: "environment",
    pos: "noun",
    ipaUk: "ɪnˈvaɪrənmənt",
    ipaUs: null,
    translationVi: "môi trường",
    definitionEn: "the natural world",
    definitionVi: null,
    exampleEn: "Protect the environment.",
    exampleVi: "Bảo vệ môi trường.",
  };

  it("fills every field and replaces previous content (AC-NT-24, AC-NT-33)", () => {
    expect(cardValuesFromDictionary(choice)).toEqual({
      word: "environment",
      meaningVi: "môi trường",
      ipaUk: "ɪnˈvaɪrənmənt",
      ipaUs: "",
      pos: "noun",
      definitionEn: "the natural world",
      definitionVi: "",
      exampleEn: "Protect the environment.",
      exampleVi: "Bảo vệ môi trường.",
    });
  });

  it("leaves part of speech empty when the dictionary uses one outside the card list (AC-NT-60)", () => {
    expect(cardValuesFromDictionary({ ...choice, headword: "UN", pos: "abbreviation" }).pos).toBe("");
  });

  it("detects whether the form already has content", () => {
    expect(hasCardContent(EMPTY_CARD)).toBe(false);
    expect(hasCardContent({ ...EMPTY_CARD, exampleVi: "x" })).toBe(true);
  });
});

describe("contentFailure", () => {
  it("maps not-found codes to the matching gone state (AC-NT-03, 12, 27, 36)", () => {
    expect(contentFailure(apiError({ kind: "notFound", status: 404, code: "VOCAB_DECK_NOT_FOUND" }))).toEqual({
      kind: "deckGone",
    });
    expect(contentFailure(apiError({ kind: "notFound", status: 404, code: "VOCAB_GROUP_NOT_FOUND" }))).toEqual({
      kind: "groupGone",
    });
    expect(contentFailure(apiError({ kind: "notFound", status: 404, code: "VOCAB_CARD_NOT_FOUND" }))).toEqual({
      kind: "cardGone",
    });
  });

  it("maps another teacher's deck to forbidden (AC-NT-02)", () => {
    expect(contentFailure(apiError({ kind: "forbidden", status: 403 }))).toEqual({ kind: "forbidden" });
  });

  it("maps duplicate group name and duplicate word to field errors (AC-NT-06, 30)", () => {
    expect(contentFailure(apiError({ kind: "conflict", status: 409, code: "VOCAB_GROUP_NAME_TAKEN" }))).toEqual({
      kind: "fields",
      errors: { name: "Duplicate" },
    });
    expect(
      contentFailure(
        apiError({
          kind: "conflict",
          status: 409,
          code: "VOCAB_CARD_WORD_TAKEN",
          details: { word: "Sustain", groupName: "Môi trường", cardId: "c1" },
        }),
      ),
    ).toEqual({ kind: "fields", errors: { word: "Duplicate" }, wordTaken: { word: "Sustain", groupName: "Môi trường" } });
  });

  it("maps the publishable rule with its reason (AC-NT-20, 45, 58)", () => {
    expect(
      contentFailure(
        apiError({ kind: "conflict", status: 409, code: "VOCAB_DECK_MUST_STAY_PUBLISHABLE", details: { reason: "LAST_CARD" } }),
      ),
    ).toEqual({ kind: "mustStayPublishable", reason: "LAST_CARD" });
  });

  it("keeps the first server error of each field", () => {
    expect(
      contentFailure(
        apiError({
          kind: "validation",
          status: 400,
          fieldErrors: [
            { field: "word", code: "NotBlank" },
            { field: "word", code: "Size" },
            { field: "pos", code: "Pattern" },
          ],
        }),
      ),
    ).toEqual({ kind: "fields", errors: { word: "NotBlank", pos: "Pattern" } });
  });

  it("asks to retry on network or server errors (AC-NT-07, 31)", () => {
    expect(contentFailure(apiError({ kind: "network" }))).toEqual({ kind: "retry" });
    expect(contentFailure(apiError({ kind: "server", status: 500 }))).toEqual({ kind: "retry" });
  });
});

describe("attachImagesInBatches (UC-NT-08)", () => {
  const image = (name: string, size = 1000, type = "image/jpeg") => ({ name, size, type });

  it("skips non-images and oversized files, reports failed uploads and merges server results", async () => {
    const files = [image("sustain.jpg"), image("note.pdf", 10, "application/pdf"), image("big.png", 3_000_000, "image/png"), image("lost.jpg")];
    const upload = vi.fn(async (file: { name: string }) => {
      if (file.name === "lost.jpg") throw new Error("network");
      return `key-${file.name}`;
    });
    const attach = vi.fn(async (items: { fileName: string; imageKey: string }[]) => ({
      attached: items.map((item) => ({ cardId: "c1", word: "sustain", fileName: item.fileName })),
      unmatched: [],
      duplicated: [],
      invalid: [],
    }));

    const summary = await attachImagesInBatches(files, upload, attach);

    expect(summary.invalid).toEqual(["note.pdf", "big.png"]);
    expect(summary.failed).toEqual(["lost.jpg"]);
    expect(summary.attached.map((a) => a.fileName)).toEqual(["sustain.jpg"]);
    expect(attach).toHaveBeenCalledWith([{ fileName: "sustain.jpg", imageKey: "key-sustain.jpg" }]);
  });

  it("sends at most 100 images per request, in the order chosen", async () => {
    const files = Array.from({ length: ATTACH_BATCH + 5 }, (_, i) => image(`w${i}.jpg`));
    const batches: string[][] = [];
    const summary = await attachImagesInBatches(
      files,
      async (file) => `k-${file.name}`,
      async (items) => {
        batches.push(items.map((item) => item.fileName));
        return { attached: [], unmatched: items.map((item) => item.fileName), duplicated: [], invalid: [] };
      },
    );

    expect(batches.map((b) => b.length)).toEqual([ATTACH_BATCH, 5]);
    expect(batches[0][0]).toBe("w0.jpg");
    expect(summary.unmatched).toHaveLength(ATTACH_BATCH + 5);
  });

  it("does not call the server when no image is valid", async () => {
    const attach = vi.fn();
    const summary = await attachImagesInBatches([image("a.gif", 10, "image/gif")], vi.fn(), attach);

    expect(attach).not.toHaveBeenCalled();
    expect(summary.invalid).toEqual(["a.gif"]);
  });
});

describe("import file (BR-NT-07)", () => {
  it("accepts .xlsx and .csv up to 2 MB (AC-NT-53)", () => {
    expect(validateImportFile({ name: "the.XLSX", size: 10 })).toBeNull();
    expect(validateImportFile({ name: "the.csv", size: 2_097_152 })).toBeNull();
    expect(validateImportFile({ name: "the.pdf", size: 10 })).toBe("FORMAT");
    expect(validateImportFile({ name: "the.xlsx", size: 5 * 1024 * 1024 })).toBe("TOO_LARGE");
    expect(validateImportFile({ name: "the.csv", size: 0 })).toBe("EMPTY");
  });

  it("maps server import errors (AC-NT-53, 54, 55)", () => {
    expect(
      importFailure(
        apiError({
          kind: "validation",
          status: 400,
          code: "VOCAB_IMPORT_FILE_INVALID",
          details: { reason: "MISSING_COLUMNS", missingColumns: ["Từ vựng"] },
        }),
      ),
    ).toEqual({ kind: "file", reason: "MISSING_COLUMNS", missingColumns: ["Từ vựng"] });
    expect(importFailure(apiError({ status: 422, code: "VOCAB_IMPORT_TOO_MANY_ROWS", details: { max: 500 } }))).toEqual({
      kind: "tooManyRows",
      max: 500,
    });
    const errors = [{ row: 5, field: "meaningVi", code: "NotBlank" }];
    expect(importFailure(apiError({ status: 422, code: "VOCAB_IMPORT_ROWS_INVALID", details: { errors } }))).toEqual({
      kind: "rows",
      errors,
    });
    expect(importFailure(apiError({ status: 413 }))).toEqual({ kind: "file", reason: "TOO_LARGE", missingColumns: [] });
    expect(importFailure(apiError({ kind: "network" }))).toEqual({ kind: "content", failure: { kind: "retry" } });
  });
});

describe("formatIpa", () => {
  it("giữ đúng một cặp dấu gạch chéo", () => {
    expect(formatIpa("/səˈsteɪn/")).toBe("/səˈsteɪn/");
    expect(formatIpa("səˈsteɪn")).toBe("/səˈsteɪn/");
    expect(formatIpa(" //θraɪv// ")).toBe("/θraɪv/");
  });
});

describe("splitByWord", () => {
  it("đánh dấu từ vựng trong câu, không phân biệt hoa thường", () => {
    expect(splitByWord("Sustain it, then sustain more.", "sustain")).toEqual([
      { text: "Sustain", match: true },
      { text: " it, then ", match: false },
      { text: "sustain", match: true },
      { text: " more.", match: false },
    ]);
  });

  it("thoát ký tự đặc biệt của biểu thức chính quy", () => {
    expect(splitByWord("Is it (a)?", "(a)?")).toEqual([
      { text: "Is it ", match: false },
      { text: "(a)?", match: true },
    ]);
  });
});
