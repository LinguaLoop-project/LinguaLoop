import { describe, expect, it } from "vitest";
import { homePathFor, onboardingRedirectFor } from "./navigation";

describe("onboardingRedirectFor (BR-TK-12, AC-TK-46)", () => {
  it("sends a student who has not set up a profile to /onboarding from any other page", () => {
    const student = { role: "student", onboarded: false } as const;
    expect(onboardingRedirectFor(student, "/student")).toBe("/onboarding");
    expect(onboardingRedirectFor(student, "/student/vocab")).toBe("/onboarding");
  });

  it("does not loop on the onboarding page itself", () => {
    expect(onboardingRedirectFor({ role: "student", onboarded: false }, "/onboarding")).toBeNull();
  });

  it("leaves onboarded students, teachers and admins alone", () => {
    expect(onboardingRedirectFor({ role: "student", onboarded: true }, "/student")).toBeNull();
    expect(onboardingRedirectFor({ role: "teacher", onboarded: false }, "/instructor")).toBeNull();
    expect(onboardingRedirectFor({ role: "admin", onboarded: false }, "/admin")).toBeNull();
  });
});

describe("homePathFor", () => {
  it("opens onboarding first for a new student and the student home afterwards", () => {
    expect(homePathFor({ role: "student", onboarded: false })).toBe("/onboarding");
    expect(homePathFor({ role: "student", onboarded: true })).toBe("/student");
  });
});
