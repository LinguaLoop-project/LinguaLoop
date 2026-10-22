import { describe, expect, it } from "vitest";
import { parseOutcome, parseTarget, parseTopic, tick } from "./rules";
import type { TickInput } from "./rules";
import type { TutorLimits } from "./types";

const limits: TutorLimits = {
  maxSeconds: 600,
  wrapUpAtSeconds: 540,
  startTimeoutSeconds: 15,
  maxAttemptsPerWord: 3,
  maxSentenceAttempts: 3,
  idleAskSeconds: 60,
  idleEndSeconds: 90,
  offTopicEndStreak: 3,
};

const base: TickInput = {
  activeMs: 0,
  idleMs: 0,
  idleAsked: false,
  wrapUpSent: false,
  dtMs: 250,
  phase: "live",
  holding: false,
  tutorSpeaking: false,
  limits,
};

describe("tick", () => {
  it("cộng thời gian đã học và thời gian im lặng", () => {
    const r = tick({ ...base, activeMs: 1000, idleMs: 500 });
    expect(r.activeMs).toBe(1250);
    expect(r.idleMs).toBe(750);
    expect(r.seconds).toBe(1);
    expect(r.actions).toEqual([]);
  });

  it("không đếm giờ chờ Azure (phase assessing)", () => {
    const r = tick({ ...base, phase: "assessing", activeMs: 5000, idleMs: 3000 });
    expect(r.activeMs).toBe(5000);
    expect(r.idleMs).toBe(3000);
  });

  it("chốt ở trần: timeout ngay khi đủ maxSeconds, chưa đủ thì không", () => {
    expect(tick({ ...base, activeMs: 599_750 }).actions).toContain("timeout");
    expect(tick({ ...base, activeMs: 599_500 }).actions).not.toContain("timeout");
  });

  it("nhắc chốt lại một lần ở phút thứ 9, chỉ khi đang trò chuyện", () => {
    expect(tick({ ...base, activeMs: 539_750 }).actions).toEqual(["wrapUp"]);
    expect(tick({ ...base, activeMs: 540_000, wrapUpSent: true }).actions).toEqual([]);
    expect(tick({ ...base, activeMs: 540_000, phase: "scoring" }).actions).toEqual([]);
  });

  it("im lặng 60 giây thì hỏi, hỏi một lần; 90 giây thì kết thúc", () => {
    const ask = tick({ ...base, idleMs: 59_750 });
    expect(ask.actions).toEqual(["idleAsk"]);
    expect(ask.idleAsked).toBe(true);
    expect(tick({ ...base, idleMs: 60_000, idleAsked: true }).actions).toEqual([]);
    expect(tick({ ...base, idleMs: 89_750, idleAsked: true }).actions).toEqual(["idleEnd"]);
  });

  it("gia sư đang nói hoặc người học đang giữ nút thì tạm dừng đếm im lặng, không xoá", () => {
    expect(tick({ ...base, idleMs: 30_000, tutorSpeaking: true }).idleMs).toBe(30_000);
    expect(tick({ ...base, phase: "scoring", holding: true, idleMs: 30_000 }).idleMs).toBe(30_000);
    expect(tick({ ...base, phase: "scoring", holding: false, idleMs: 30_000 }).idleMs).toBe(30_250);
  });

  it("chờ người học đọc (scoring) không hỏi 'còn muốn luyện không' nhưng vẫn kết thúc khi im quá lâu", () => {
    expect(tick({ ...base, phase: "scoring", idleMs: 59_750 }).actions).toEqual([]);
    expect(tick({ ...base, phase: "scoring", idleMs: 89_750 }).actions).toEqual(["idleEnd"]);
  });
});

describe("tham số tool từ mô hình", () => {
  it("ép về giá trị hợp lệ", () => {
    expect(parseOutcome("completed")).toBe("completed");
    expect(parseOutcome("off_topic")).toBe("off_topic");
    expect(parseOutcome("timeout")).toBe("learner_exit"); // mô hình không tự khai hết giờ hay im lặng
    expect(parseOutcome(undefined)).toBe("learner_exit");
    expect(parseTopic("off_topic")).toBe("off_topic");
    expect(parseTopic("whatever")).toBe("on_topic");
    expect(parseTarget("sentence")).toBe("sentence");
    expect(parseTarget(42)).toBe("word");
  });
});
