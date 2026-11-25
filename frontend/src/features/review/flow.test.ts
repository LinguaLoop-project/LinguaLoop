import { describe, expect, it } from "vitest";
import {
  cardCount,
  cardSourceParts,
  hasFilledCards,
  hasSuggestions,
  phaseAfterCards,
  startPhase,
  stepStates,
  summarizeSentences,
} from "./flow";

/** `cardsMore` là số thẻ của lượt "Ôn thêm"; mặc định bằng số thẻ của phiên. */
const plan = (cardsInPlan: number, sentences: number, cardsMore = cardsInPlan) => ({
  cardsInPlan,
  cardsMore,
  sentences: new Array<unknown>(sentences).fill(0),
});

describe("startPhase (UC-HT-05, AC-HT-37, AC-HT-40, AC-HT-60)", () => {
  it("starts with cards when there are cards due", () => {
    expect(startPhase(plan(20, 4), false)).toBe("cards");
  });

  it("goes straight to sentences when no card is due (2a)", () => {
    expect(startPhase(plan(0, 4), false)).toBe("sentences");
  });

  it("reports nothing to review when both parts are empty (2c)", () => {
    expect(startPhase(plan(0, 0), false)).toBe("empty");
  });

  it("ignores sentences in a more round (AC-HT-37)", () => {
    expect(startPhase(plan(0, 4), true)).toBe("empty");
    expect(startPhase(plan(15, 4), true)).toBe("cards");
  });

  it("opens a more round on the cards still due once the daily quota is met (BR-HT-24)", () => {
    // đã đủ định mức: phiên thường trống, nhưng "Ôn thêm" vẫn có 5 thẻ còn đến hạn
    expect(startPhase(plan(0, 0, 5), false)).toBe("empty");
    expect(startPhase(plan(0, 0, 5), true)).toBe("cards");
  });
});

describe("cardCount (AC-HT-37, AC-HT-60)", () => {
  it("uses the remaining quota normally and the cards still due in a more round", () => {
    expect(cardCount(plan(8, 0, 20), false)).toBe(8);
    expect(cardCount(plan(8, 0, 20), true)).toBe(20);
  });
});

describe("phaseAfterCards", () => {
  it("bridges to sentences without an intermediate summary", () => {
    expect(phaseAfterCards(plan(20, 4), false)).toBe("bridge");
  });

  it("finishes after the cards when there are no sentences (2b) or in a keep-reviewing round", () => {
    expect(phaseAfterCards(plan(20, 0), false)).toBe("summary");
    expect(phaseAfterCards(plan(15, 4), true)).toBe("summary");
  });
});

describe("stepStates", () => {
  it("marks the active, finished and upcoming parts", () => {
    expect(stepStates("cards", true, true)).toEqual({ cards: "active", sentences: "todo" });
    expect(stepStates("bridge", true, true)).toEqual({ cards: "done", sentences: "todo" });
    expect(stepStates("sentences", true, true)).toEqual({ cards: "done", sentences: "active" });
    expect(stepStates("summary", true, true)).toEqual({ cards: "done", sentences: "done" });
  });

  it("leaves out a part the session does not have", () => {
    expect(stepStates("sentences", false, true)).toEqual({ cards: null, sentences: "active" });
    expect(stepStates("cards", true, false)).toEqual({ cards: "active", sentences: null });
  });
});

describe("hasSuggestions", () => {
  const lesson = { id: "l", title: "t", cefrLevel: "A1", sentenceCount: 3 };

  it("is true when any one of the suggestions exists", () => {
    expect(hasSuggestions({ newWords: null, dictationLesson: null, shadowingLesson: lesson })).toBe(true);
    expect(hasSuggestions({ newWords: null, dictationLesson: lesson, shadowingLesson: null })).toBe(true);
  });

  it("is false when there is nothing to suggest or no suggestions at all", () => {
    expect(hasSuggestions({ newWords: null, dictationLesson: null, shadowingLesson: null })).toBe(false);
    expect(hasSuggestions(null)).toBe(false);
  });
});

describe("summarizeSentences", () => {
  it("averages only sentences that were really reviewed", () => {
    const outcomes = [
      { sentenceId: "a", mode: "dictation", score: 80, skipped: false },
      { sentenceId: "b", mode: "shadowing", score: 61, skipped: false },
      { sentenceId: "c", mode: "shadowing", score: null, skipped: true },
    ] as const;
    expect(summarizeSentences(outcomes)).toEqual({ reviewed: 2, skipped: 1, average: 71 });
  });

  it("has no average when nothing was reviewed", () => {
    expect(summarizeSentences([])).toEqual({ reviewed: 0, skipped: 0, average: null });
  });
});

describe("cardSourceParts (BR-HT-29, AC-HT-76)", () => {
  it("lists the sources of the session in the order due, new words, reinforce", () => {
    expect(cardSourceParts({ due: 3, newWords: 7, reinforce: 10 })).toEqual([
      { key: "due", count: 3 },
      { key: "newWords", count: 7 },
      { key: "reinforce", count: 10 },
    ]);
  });

  it("drops the sources that contribute no card", () => {
    expect(cardSourceParts({ due: 0, newWords: 5, reinforce: 0 })).toEqual([{ key: "newWords", count: 5 }]);
    expect(cardSourceParts({ due: 0, newWords: 0, reinforce: 0 })).toEqual([]);
  });

  it("tolerates a missing breakdown", () => {
    expect(cardSourceParts(null)).toEqual([]);
    expect(cardSourceParts(undefined)).toEqual([]);
  });
});

describe("hasFilledCards (BR-HT-29)", () => {
  it("only notes the sources when the frame added new words or reinforcement cards", () => {
    expect(hasFilledCards({ due: 20, newWords: 0, reinforce: 0 })).toBe(false);
    expect(hasFilledCards({ due: 3, newWords: 7, reinforce: 0 })).toBe(true);
    expect(hasFilledCards({ due: 3, newWords: 0, reinforce: 17 })).toBe(true);
    expect(hasFilledCards(undefined)).toBe(false);
  });
});
