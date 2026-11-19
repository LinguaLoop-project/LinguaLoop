import { describe, expect, it } from "vitest";
import { contentApiBase, myDeckPath, MY_DECKS_PATH } from "./deckManagePaths";

describe("contentApiBase (UC-BT-04, UC-HT-09)", () => {
  it("points teachers and admins at the library deck API", () => {
    expect(contentApiBase("teacher")).toBe("/teacher/vocab/decks");
    expect(contentApiBase("admin")).toBe("/admin/vocab/decks");
  });

  it("points learners at their own personal decks", () => {
    expect(contentApiBase("learner")).toBe("/vocab/my-decks");
  });
});

describe("My decks paths", () => {
  it("opens one personal deck under the student vocabulary area, away from the library deck route", () => {
    expect(myDeckPath("abc")).toBe("/student/vocab/mine/abc");
  });

  it("goes back to the My decks tab of the vocabulary page", () => {
    expect(MY_DECKS_PATH).toBe("/student/vocab?tab=mine");
  });
});
