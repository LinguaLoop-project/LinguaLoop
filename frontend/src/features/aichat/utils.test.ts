import { describe, expect, it } from "vitest";
import type { ChatMessage, ChatSession } from "./types";
import { canFinish, formatClock, pendingQuestion, questionNumber, secondsLeft, validAnswerText } from "./utils";

const message = (role: ChatMessage["role"], id: number): ChatMessage => ({
  id,
  role,
  text: "x",
  feedback: null,
  better: null,
  hint: null,
  voice: false,
  at: "2026-11-20T00:00:00Z",
});

const session = (over: Partial<ChatSession> = {}): ChatSession => ({
  id: "s",
  mode: "text",
  style: "qa",
  status: "active",
  startedAt: "2026-11-20T00:00:00Z",
  endedAt: null,
  expiresAt: "2026-11-20T00:15:00Z",
  answered: 0,
  maxQuestions: 5,
  awaitingSummary: false,
  summary: null,
  messages: [message("tutor", 1)],
  ...over,
});

describe("aichat utils", () => {
  it("secondsLeft counts down to the 15 minute mark and never goes negative (BR-AI-11)", () => {
    const start = Date.parse("2026-11-20T00:00:00Z");
    expect(secondsLeft("2026-11-20T00:15:00Z", start)).toBe(900);
    expect(secondsLeft("2026-11-20T00:15:00Z", start + 899_500)).toBe(1);
    expect(secondsLeft("2026-11-20T00:15:00Z", start + 901_000)).toBe(0);
  });

  it("formatClock pads seconds", () => {
    expect(formatClock(905)).toBe("15:05");
    expect(formatClock(59)).toBe("0:59");
    expect(formatClock(-3)).toBe("0:00");
  });

  it("pendingQuestion is the last tutor line of an active session only", () => {
    expect(pendingQuestion(session())?.id).toBe(1);
    expect(pendingQuestion(session({ messages: [message("tutor", 1), message("student", 2)] }))).toBeNull();
    expect(pendingQuestion(session({ status: "completed" }))).toBeNull();
    expect(pendingQuestion(null)).toBeNull();
  });

  it("questionNumber counts tutor lines and is capped at the maximum", () => {
    expect(questionNumber(session())).toBe(1);
    const many = Array.from({ length: 12 }, (_, i) => message(i % 2 === 0 ? "tutor" : "student", i));
    expect(questionNumber(session({ messages: many }))).toBe(5);
  });

  it("canFinish needs an open session and at least one answer (BR-AI-09)", () => {
    expect(canFinish(session())).toBe(false);
    expect(canFinish(session({ answered: 1 }))).toBe(true);
    expect(canFinish(session({ answered: 3, status: "completed" }))).toBe(false);
    expect(canFinish(null)).toBe(false);
  });

  it("validAnswerText accepts 1 to 1000 characters after trimming (BR-AI-06)", () => {
    expect(validAnswerText("   ")).toBe(false);
    expect(validAnswerText(" a ")).toBe(true);
    expect(validAnswerText("x".repeat(1000))).toBe(true);
    expect(validAnswerText("x".repeat(1001))).toBe(false);
  });
});
