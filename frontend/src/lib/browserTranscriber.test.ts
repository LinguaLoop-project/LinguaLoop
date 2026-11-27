import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserTranscriber } from "./browserTranscriber";

type Handler = ((event: unknown) => void) | null;

class FakeRecognition {
  static last: FakeRecognition;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: Handler = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  starts = 0;
  constructor() {
    FakeRecognition.last = this;
  }
  start() {
    this.starts++;
  }
  stop() {}
  abort() {}
  say(...texts: string[]) {
    this.onresult?.({ results: texts.map((t) => [{ transcript: t }]) });
  }
}

function install() {
  vi.stubGlobal("window", { webkitSpeechRecognition: FakeRecognition });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BrowserTranscriber", () => {
  it("không có Web Speech API thì create trả null để controller giữ chữ của Gemini", () => {
    expect(BrowserTranscriber.supported()).toBe(false);
    expect(BrowserTranscriber.create({ onText: vi.fn(), isActive: () => true })).toBeNull();
  });

  it("khóa tiếng Anh, chép liên tục và đưa ra cả lượt nói kể cả phần chưa chốt", () => {
    install();
    const onText = vi.fn();
    const stt = BrowserTranscriber.create({ onText, isActive: () => true })!;
    stt.start();
    const r = FakeRecognition.last;
    expect([r.lang, r.continuous, r.interimResults]).toEqual(["en-US", true, true]);

    r.say("kiki is");
    r.say("kiki is a young witch");
    expect(onText).toHaveBeenLastCalledWith("kiki is a young witch");
    expect(stt.working).toBe(true);
  });

  it("reset bắt đầu lượt nói mới, không lẫn chữ cũ", () => {
    install();
    const onText = vi.fn();
    const stt = BrowserTranscriber.create({ onText, isActive: () => true })!;
    stt.start();
    const r = FakeRecognition.last;
    r.say("first answer");
    stt.reset();
    r.say("first answer", "second answer");
    expect(onText).toHaveBeenLastCalledWith("second answer");
  });

  it("bỏ chữ lúc không hoạt động (gia sư đang nói) và không đem sang lượt sau", () => {
    install();
    const onText = vi.fn();
    let active = false;
    const stt = BrowserTranscriber.create({ onText, isActive: () => active })!;
    stt.start();
    const r = FakeRecognition.last;
    r.say("tutor voice from the speaker");
    expect(onText).not.toHaveBeenCalled();
    active = true;
    r.say("tutor voice from the speaker", "my answer");
    expect(onText).toHaveBeenLastCalledWith("my answer");
  });

  it("Chrome tự đóng khi im lặng thì mở lại và đếm lại từ đầu", () => {
    install();
    const onText = vi.fn();
    const stt = BrowserTranscriber.create({ onText, isActive: () => true })!;
    stt.start();
    const r = FakeRecognition.last;
    r.say("one");
    r.onend?.();
    expect(r.starts).toBe(2);
    r.say("two");
    expect(onText).toHaveBeenLastCalledWith("two");
  });

  it("không cho dùng mic thì đánh dấu hỏng và không mở lại", () => {
    install();
    const stt = BrowserTranscriber.create({ onText: vi.fn(), isActive: () => true })!;
    stt.start();
    const r = FakeRecognition.last;
    r.onerror?.({ error: "not-allowed" });
    r.onend?.();
    expect(stt.working).toBe(false);
    expect(r.starts).toBe(1);
  });

  it("stop thì không mở lại khi bị đóng", () => {
    install();
    const stt = BrowserTranscriber.create({ onText: vi.fn(), isActive: () => true })!;
    stt.start();
    stt.stop();
    FakeRecognition.last.onend?.();
    expect(FakeRecognition.last.starts).toBe(1);
  });
});
