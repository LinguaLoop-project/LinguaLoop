import { describe, expect, it } from "vitest";
import { hasSuggestions, phaseAfterCards, startPhase, stepStates, summarizeSentences } from "./flow";

const plan = (cardsInPlan: number, sentences: number) => ({ cardsInPlan, sentences: new Array<unknown>(sentences).fill(0) });

describe("startPhase (UC-HT-05)", () => {
  it("starts with cards when there are cards due", () => {
    expect(startPhase(plan(20, 4), false)).toBe("cards");
  });

  it("goes straight to sentences when no card is due (2a)", () => {
    expect(startPhase(plan(0, 4), false)).toBe("sentences");
  });

  it("reports nothing to review when both parts are empty (2c)", () => {
    expect(startPhase(plan(0, 0), false)).toBe("empty");
  });

  it("ignores sentences in a keep-reviewing round (AC-HT-37)", () => {
    expect(startPhase(plan(0, 4), true)).toBe("empty");
    expect(startPhase(plan(15, 4), true)).toBe("cards");
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
