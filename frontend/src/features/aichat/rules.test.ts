import { describe, expect, it } from "vitest";
import { asText, tick } from "./rules";
import type { TickInput } from "./rules";

const limits = { maxQuestions: 5, maxSeconds: 900, wrapUpAtSeconds: 840, startTimeoutSeconds: 15, idleAskSeconds: 60, idleEndSeconds: 90 };
const base: TickInput = { activeMs: 0, idleMs: 0, idleAsked: false, wrapUpSent: false, dtMs: 250, tutorSpeaking: false, limits };

describe("tick", () => {
  it("chốt ở trần 15 phút, chưa đủ thì không", () => {
    expect(tick({ ...base, activeMs: 899_750 }).actions).toEqual(["timeout"]);
    expect(tick({ ...base, activeMs: 899_500 }).actions).not.toContain("timeout");
  });

  it("nhắc gia sư chốt lại một lần khi còn một phút", () => {
    expect(tick({ ...base, activeMs: 839_750 }).actions).toEqual(["wrapUp"]);
    expect(tick({ ...base, activeMs: 840_000, wrapUpSent: true }).actions).toEqual([]);
  });

  it("im lặng quá 60 giây thì gia sư hỏi một lần, quá 90 giây thì kết thúc", () => {
    expect(tick({ ...base, idleMs: 59_750 }).actions).toEqual(["idleAsk"]);
    expect(tick({ ...base, idleMs: 60_000, idleAsked: true }).actions).toEqual([]);
    expect(tick({ ...base, idleMs: 89_750, idleAsked: true }).actions).toEqual(["idleEnd"]);
  });

  it("gia sư đang nói thì không đếm im lặng", () => {
    const next = tick({ ...base, idleMs: 30_000, tutorSpeaking: true });
    expect(next.idleMs).toBe(30_000);
  });

  it("báo giây đã học", () => {
    expect(tick({ ...base, activeMs: 61_900 }).seconds).toBe(62);
  });
});

describe("asText", () => {
  it("chỉ nhận chuỗi, bỏ khoảng trắng hai đầu", () => {
    expect(asText("  hi ")).toBe("hi");
    expect(asText(42)).toBe("");
    expect(asText(undefined)).toBe("");
  });
});
