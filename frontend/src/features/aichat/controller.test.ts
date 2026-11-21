import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveChatController, errorCode } from "./controller";
import type { LiveChatParams, PlayClip } from "./controller";
import type { ChatMessage, ChatSession, ChatTurn, LiveStart } from "./types";

// Gemini, micro và loa là thật khi chạy app; ở đây thay bằng bản giả để kiểm luồng của controller.
const h = vi.hoisted(() => ({
  live: { sendRealtimeInput: vi.fn(), sendToolResponse: vi.fn(), close: vi.fn() },
  callbacks: null as null | { onmessage: (m: unknown) => void; onclose: () => void },
  onChunk: null as null | ((pcm: Int16Array) => void),
  micFails: false,
}));

vi.mock("@google/genai", () => ({
  Modality: { AUDIO: "AUDIO" },
  GoogleGenAI: class {
    live = {
      connect: async (opts: { callbacks: NonNullable<typeof h.callbacks> }) => {
        h.callbacks = opts.callbacks;
        return h.live;
      },
    };
  },
}));
vi.mock("@/lib/pcmRecorder", () => ({
  MIC_RATE: 16000,
  MicCapture: {
    create: async (onChunk: (pcm: Int16Array) => void) => {
      if (h.micFails) throw new Error("denied");
      h.onChunk = onChunk;
      return { stop: vi.fn() };
    },
  },
  int16Level: () => 0,
}));
vi.mock("@/features/tutor/audio", () => ({
  PcmPlayer: class {
    resume = async () => undefined;
    flush() {}
    enqueue() {}
    close() {}
    level() {
      return 0;
    }
    whenIdle = async () => undefined;
  },
  int16ToBase64: () => "",
}));

const limits = { maxQuestions: 5, maxSeconds: 900, wrapUpAtSeconds: 840, startTimeoutSeconds: 15, idleAskSeconds: 60, idleEndSeconds: 90 };
const balance = { kind: "free", balance: 15 } as unknown as LiveStart["balance"];
const clips = [
  { n: 1, startMs: 0, endMs: 4000 },
  { n: 2, startMs: 4000, endMs: 8000 },
];
const live: LiveStart = { id: "s1", token: "tok", model: "live-model", tokenExpiresAt: "2026-11-20T10:00:00Z", limits, cost: 5, balance, style: "qa", clips };

const msg = (id: number, role: ChatMessage["role"], over: Partial<ChatMessage> = {}): ChatMessage => ({
  id, role, text: role === "tutor" ? `Question ${id}?` : `Answer ${id}`, feedback: null, better: null, hint: null, voice: role === "student", at: "t", ...over,
});
const session = (messages: ChatMessage[], over: Partial<ChatSession> = {}): ChatSession => ({
  id: "s1", mode: "live", style: "qa", status: "active", startedAt: "t", endedAt: null, expiresAt: "t", answered: messages.filter((m) => m.role === "student").length,
  maxQuestions: 5, awaitingSummary: false, summary: null, messages, ...over,
});
const turn = (s: ChatSession): ChatTurn => ({ session: s, credit: { charged: 0, balance }, expired: false });
const apiError = (code: string) => Object.assign(new Error(code), { response: { data: { code } } });

const api = {
  startLive: vi.fn(),
  liveStarted: vi.fn(),
  liveQuestion: vi.fn(),
  liveFeedback: vi.fn(),
  liveFinish: vi.fn(),
  hint: vi.fn(),
  detail: vi.fn(),
};
const onCredit = vi.fn();

const tutorSpeaks = () => h.callbacks!.onmessage({ serverContent: { modelTurn: { parts: [{ inlineData: { data: "AAAA" } }] } } });
const tutorDone = () => h.callbacks!.onmessage({ serverContent: { turnComplete: true } });
const learnerSays = (text: string) => h.callbacks!.onmessage({ serverContent: { inputTranscription: { text } } });
const toolCall = (name: string, args: Record<string, unknown>) =>
  h.callbacks!.onmessage({ toolCall: { functionCalls: [{ id: `${name}-1`, name, args }] } });
const flush = () => vi.advanceTimersByTimeAsync(0);

async function openLive(): Promise<LiveChatController> {
  const controller = new LiveChatController({ lessonId: "l1", style: "qa", api: api as unknown as LiveChatParams["api"], onCredit });
  await controller.start();
  expect(controller.getState().phase).toBe("live");
  return controller;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  h.micFails = false;
  api.startLive.mockResolvedValue(live);
  api.liveStarted.mockResolvedValue({ charged: 5, balance });
  api.liveFinish.mockImplementation(async () => turn(session([msg(1, "tutor"), msg(2, "student")], { status: "completed", summary: "Tốt." })));
  api.detail.mockResolvedValue(session([]));
});

afterEach(() => vi.useRealTimers());

describe("bắt đầu", () => {
  it("xin token, nối Gemini, mời gia sư bắt đầu và chưa báo started cho tới khi gia sư nói", async () => {
    await openLive();

    expect(api.startLive).toHaveBeenCalledWith("l1", "qa");
    expect(h.live.sendRealtimeInput).toHaveBeenCalledWith({ text: expect.stringContaining("Người học đã vào phiên") });
    expect(api.liveStarted).not.toHaveBeenCalled();

    tutorSpeaks();
    await flush();
    tutorSpeaks(); // lần nói thứ hai không báo lại
    await flush();

    expect(api.liveStarted).toHaveBeenCalledTimes(1);
    expect(onCredit).toHaveBeenCalledWith(balance);
  });

  it("không có micro: vào dự phòng với mã MIC_UNAVAILABLE và không tạo phiên", async () => {
    h.micFails = true;
    const controller = new LiveChatController({ lessonId: "l1", style: "qa", api: api as unknown as LiveChatParams["api"] });

    await controller.start();

    expect(controller.getState().phase).toBe("fallback");
    expect(controller.getState().fallbackCode).toBe("MIC_UNAVAILABLE");
    expect(api.startLive).not.toHaveBeenCalled();
  });

  it("server từ chối mở phiên (hết credit): dự phòng kèm mã lỗi", async () => {
    api.startLive.mockRejectedValue(apiError("QUOTA_EXCEEDED"));
    const controller = new LiveChatController({ lessonId: "l1", style: "qa", api: api as unknown as LiveChatParams["api"] });

    await controller.start();

    expect(controller.getState().phase).toBe("fallback");
    expect(controller.getState().fallbackCode).toBe("QUOTA_EXCEEDED");
  });

  it("gia sư không nói trong thời gian chờ: dự phòng START_TIMEOUT và không kết thúc phiên trên server", async () => {
    const controller = await openLive();

    await vi.advanceTimersByTimeAsync(16_000);

    expect(controller.getState().phase).toBe("fallback");
    expect(controller.getState().fallbackCode).toBe("START_TIMEOUT");
    expect(h.live.close).toHaveBeenCalled();
    expect(api.liveFinish).not.toHaveBeenCalled();
  });

  it("server từ chối started (hết credit ở tab khác): dừng và báo mã lỗi", async () => {
    api.liveStarted.mockRejectedValue(apiError("QUOTA_EXCEEDED"));
    const controller = await openLive();

    tutorSpeaks();
    await flush();

    expect(controller.getState().phase).toBe("fallback");
    expect(controller.getState().fallbackCode).toBe("QUOTA_EXCEEDED");
  });

  it("lỗi mạng khi báo started chỉ cảnh báo, phiên vẫn tiếp tục", async () => {
    api.liveStarted.mockRejectedValue(new Error("offline"));
    const controller = await openLive();

    tutorSpeaks();
    await flush();

    expect(controller.getState().phase).toBe("live");
  });
});

describe("tool đến cùng lúc với started", () => {
  it("next_question chờ lời báo started xong rồi mới gửi lên server", async () => {
    let release!: () => void;
    api.liveStarted.mockReturnValue(new Promise((resolve) => (release = () => resolve({ charged: 5, balance }))));
    api.liveQuestion.mockResolvedValue(session([msg(1, "tutor")]));
    await openLive();

    tutorSpeaks();
    toolCall("next_question", { question: "Who is talking?" });
    await flush();
    expect(api.liveQuestion).not.toHaveBeenCalled(); // server chưa trừ credit nên sẽ từ chối

    release();
    await flush();
    expect(api.liveQuestion).toHaveBeenCalledWith("l1", "s1", "Who is talking?");
  });
});

describe("lời gọi tool đến trước mọi âm thanh", () => {
  it("lượt đầu bắt đầu bằng next_question: báo started trước rồi mới gửi câu hỏi", async () => {
    const order: string[] = [];
    api.liveStarted.mockImplementation(async () => {
      order.push("started");
      return { charged: 5, balance };
    });
    api.liveQuestion.mockImplementation(async () => {
      order.push("question");
      return session([msg(1, "tutor")]);
    });
    await openLive();

    toolCall("next_question", { question: "Tell me about the video." }); // chưa có âm thanh nào của gia sư
    await flush();

    expect(order).toEqual(["started", "question"]);
  });
});

describe("một lượt gia sư chỉ nói một lần", () => {
  const lastResponse = () => h.live.sendToolResponse.mock.calls.at(-1)![0].functionResponses[0].response;

  it("give_feedback mang theo câu hỏi tiếp theo: ghi nhận xét rồi câu hỏi và bảo gia sư nói MỘT lần", async () => {
    const order: string[] = [];
    api.liveFeedback.mockImplementation(async () => {
      order.push("feedback");
      return session([msg(1, "tutor"), msg(2, "student")]);
    });
    api.liveQuestion.mockImplementation(async () => {
      order.push("question");
      return session([msg(1, "tutor"), msg(2, "student"), msg(3, "tutor")]);
    });
    const controller = await openLive();
    tutorSpeaks();

    toolCall("give_feedback", { answer: "a", feedback: "Tốt.", better: "", next_question: "And then?", sentence: 2 });
    await flush();

    expect(order).toEqual(["feedback", "question"]);
    expect(api.liveQuestion).toHaveBeenCalledWith("l1", "s1", "And then?");
    expect(controller.getState().questionClipN).toBe(2);
    expect(controller.getState().messages).toHaveLength(3);
    expect(lastResponse().instruction).toContain("MỘT LẦN DUY NHẤT");
    // câu hỏi đã được ghi nên gia sư không bị nhắc gọi next_question
    await vi.advanceTimersByTimeAsync(0);
    tutorDone();
    await vi.advanceTimersByTimeAsync(8_000);
    expect(h.live.sendRealtimeInput.mock.calls.filter(([arg]) => arg.text?.includes("next_question"))).toHaveLength(0);
  });

  it("không có next_question trong give_feedback: quay về cách cũ, nhắc gọi next_question", async () => {
    api.liveFeedback.mockResolvedValue(session([msg(1, "tutor"), msg(2, "student")]));
    await openLive();
    tutorSpeaks();

    toolCall("give_feedback", { answer: "a", feedback: "Tốt.", better: "" });
    await flush();

    expect(api.liveQuestion).not.toHaveBeenCalled();
    expect(lastResponse().instruction).toContain("gọi next_question");
  });

  it("server từ chối câu hỏi đi kèm: vẫn ghi nhận xét và quay về cách cũ", async () => {
    api.liveFeedback.mockResolvedValue(session([msg(1, "tutor"), msg(2, "student")]));
    api.liveQuestion.mockRejectedValue(apiError("AI_CHAT_TURN_CONFLICT"));
    const controller = await openLive();
    tutorSpeaks();

    toolCall("give_feedback", { answer: "a", feedback: "Tốt.", better: "", next_question: "Q?" });
    await flush();

    expect(controller.getState().answered).toBe(1);
    expect(lastResponse().instruction).toContain("gọi next_question");
  });

  it("lượt cuối bỏ qua câu hỏi đi kèm và bảo gia sư chào kết", async () => {
    const full = Array.from({ length: 5 }, (_, i) => [msg(i * 2 + 1, "tutor"), msg(i * 2 + 2, "student")]).flat();
    api.liveFeedback.mockResolvedValue(session(full));
    await openLive();
    tutorSpeaks();

    toolCall("give_feedback", { answer: "a", feedback: "Tốt.", better: "", next_question: "Six?" });
    await flush();

    expect(api.liveQuestion).not.toHaveBeenCalled();
    expect(lastResponse().instruction).toContain("end_session");
  });

  it("lời nhắc khi gia sư quên gọi tool chỉ bảo gọi tool, không bảo nói lại", async () => {
    await openLive();
    tutorSpeaks();
    await flush();

    tutorDone();
    await vi.advanceTimersByTimeAsync(7_100);

    const nudge = h.live.sendRealtimeInput.mock.calls.map(([arg]) => arg.text).find((text) => text?.includes("next_question"));
    expect(nudge).toContain("KHÔNG nói lại");
  });
});

describe("tool của gia sư", () => {
  it("next_question ghi câu hỏi lên server rồi trả số câu cho gia sư", async () => {
    api.liveQuestion.mockResolvedValue(session([msg(1, "tutor")]));
    const controller = await openLive();
    tutorSpeaks();

    toolCall("next_question", { question: "  Who is talking?  " });
    await flush();

    expect(api.liveQuestion).toHaveBeenCalledWith("l1", "s1", "Who is talking?");
    expect(controller.getState().messages).toHaveLength(1);
    expect(h.live.sendToolResponse).toHaveBeenCalledWith({
      functionResponses: [
        {
          id: "next_question-1",
          name: "next_question",
          response: { ok: true, question_number: 1, instruction: expect.stringContaining("KHÔNG nói lại") },
        },
      ],
    });
  });

  it("give_feedback ưu tiên lời chép từ giọng nói hơn lời gia sư tự thuật", async () => {
    api.liveFeedback.mockResolvedValue(session([msg(1, "tutor"), msg(2, "student")]));
    const controller = await openLive();
    tutorSpeaks();
    learnerSays("He wakes up");
    learnerSays(" early");

    toolCall("give_feedback", { answer: "paraphrase", feedback: "Đúng.", better: "He wakes up early." });
    await flush();

    expect(api.liveFeedback).toHaveBeenCalledWith("l1", "s1", { answer: "He wakes up early", feedback: "Đúng.", better: "He wakes up early." });
    expect(controller.getState().answered).toBe(1);
    const response = h.live.sendToolResponse.mock.calls.at(-1)![0].functionResponses[0].response;
    expect(response.instruction).toContain("next_question");
  });

  it("không có lời chép thì dùng lời gia sư tự thuật", async () => {
    api.liveFeedback.mockResolvedValue(session([msg(1, "tutor"), msg(2, "student")]));
    await openLive();
    tutorSpeaks();

    toolCall("give_feedback", { answer: "from the tutor", feedback: "Tốt.", better: "" });
    await flush();

    expect(api.liveFeedback.mock.calls[0][2].answer).toBe("from the tutor");
  });

  it("câu trả lời thứ 5 bảo gia sư chào kết và gọi end_session", async () => {
    const full = Array.from({ length: 5 }, (_, i) => [msg(i * 2 + 1, "tutor"), msg(i * 2 + 2, "student")]).flat();
    api.liveFeedback.mockResolvedValue(session(full));
    await openLive();
    tutorSpeaks();

    toolCall("give_feedback", { answer: "a", feedback: "Tốt.", better: "" });
    await flush();

    const response = h.live.sendToolResponse.mock.calls.at(-1)![0].functionResponses[0].response;
    expect(response.instruction).toContain("end_session");
  });

  it("server từ chối câu hỏi thứ 6: gia sư được bảo kết thúc", async () => {
    api.liveQuestion.mockRejectedValue(apiError("AI_CHAT_QUESTION_LIMIT"));
    await openLive();
    tutorSpeaks();

    toolCall("next_question", { question: "Six?" });
    await flush();

    const response = h.live.sendToolResponse.mock.calls.at(-1)![0].functionResponses[0].response;
    expect(response.error).toBeTruthy();
    expect(response.instruction).toContain("end_session");
  });

  it("end_session đóng phiên trên server và hiện nhận xét tổng quát", async () => {
    api.liveQuestion.mockResolvedValue(session([msg(1, "tutor")]));
    const controller = await openLive();
    tutorSpeaks();
    toolCall("end_session", { reason: "completed" });
    await flush();
    await flush();

    expect(api.liveFinish).toHaveBeenCalledWith("l1", "s1");
    expect(controller.getState().phase).toBe("ended");
    expect(controller.getState().finalSession?.summary).toBe("Tốt.");
    expect(h.live.close).toHaveBeenCalled();
  });
});

describe("kết thúc", () => {
  it("người học bấm Kết thúc sau khi gia sư đã nói: đóng phiên trên server", async () => {
    const controller = await openLive();
    tutorSpeaks();
    await flush();

    controller.leave();
    await flush();

    expect(api.liveFinish).toHaveBeenCalledTimes(1);
    expect(controller.getState().phase).toBe("ended");
  });

  it("thoát trước khi gia sư nói: không gọi finish, chưa trừ credit", async () => {
    const controller = await openLive();

    controller.leave();
    await flush();

    expect(api.liveFinish).not.toHaveBeenCalled();
    expect(api.liveStarted).not.toHaveBeenCalled();
    expect(h.live.close).toHaveBeenCalled();
  });

  it("tạo nhận xét lỗi: phiên kết thúc nhưng cho thử lại, và thử lại được", async () => {
    api.liveFeedback.mockResolvedValue(session([msg(1, "tutor"), msg(2, "student")]));
    const controller = await openLive();
    tutorSpeaks();
    toolCall("give_feedback", { answer: "a", feedback: "Tốt.", better: "" });
    await flush();
    api.liveFinish.mockRejectedValueOnce(apiError("AI_FEEDBACK_UNAVAILABLE"));

    controller.leave();
    await flush();
    expect(controller.getState().phase).toBe("ended");
    expect(controller.getState().summaryFailed).toBe(true);

    await controller.retrySummary();
    expect(controller.getState().summaryFailed).toBe(false);
    expect(controller.getState().finalSession?.summary).toBe("Tốt.");
  });

  it("server báo phiên đã đóng: lấy lại phiên thay vì báo lỗi", async () => {
    api.liveFinish.mockRejectedValue(apiError("AI_CHAT_NOT_ACTIVE"));
    api.detail.mockResolvedValue(session([], { status: "completed", summary: "Đã đóng." }));
    const controller = await openLive();
    tutorSpeaks();
    await flush();

    controller.leave();
    await flush();

    expect(controller.getState().finalSession?.summary).toBe("Đã đóng.");
    expect(controller.getState().summaryFailed).toBe(false);
  });

  it("đủ 15 phút: tự kết thúc", async () => {
    const controller = await openLive();
    tutorSpeaks();
    await flush();

    await vi.advanceTimersByTimeAsync(900_500);

    expect(api.liveFinish).toHaveBeenCalled();
    expect(controller.getState().phase).toBe("ended");
  });
});

describe("gia sư quên gọi tool", () => {
  it("nói xong câu chào mà không gọi next_question: được nhắc sau 7 giây, tối đa 3 lần", async () => {
    await openLive();
    tutorSpeaks();
    await flush();
    const nudges = () => h.live.sendRealtimeInput.mock.calls.filter(([arg]) => arg.text?.includes("next_question")).length;

    tutorDone();
    await vi.advanceTimersByTimeAsync(7_100);
    expect(nudges()).toBe(1);

    for (let i = 0; i < 4; i++) {
      tutorDone();
      await vi.advanceTimersByTimeAsync(7_100);
    }
    expect(nudges()).toBe(3);
  });

  it("đã gọi next_question thì không bị nhắc", async () => {
    api.liveQuestion.mockResolvedValue(session([msg(1, "tutor")]));
    await openLive();
    tutorSpeaks();
    toolCall("next_question", { question: "Q?" });
    await flush();

    tutorDone();
    await vi.advanceTimersByTimeAsync(8_000);

    expect(h.live.sendRealtimeInput.mock.calls.filter(([arg]) => arg.text?.includes("next_question"))).toHaveLength(0);
  });
});

describe("kiểu trò chuyện và phát lại video", () => {
  it("gửi kiểu đã chọn khi mở phiên", async () => {
    const controller = new LiveChatController({ lessonId: "l1", style: "interview", api: api as unknown as LiveChatParams["api"] });
    await controller.start();

    expect(api.startLive).toHaveBeenCalledWith("l1", "interview");
  });

  it("play_clip phát đúng đoạn, khóa micro rồi mới trả kết quả cho gia sư", async () => {
    const play = vi.fn().mockResolvedValue(true);
    const controller = await openLive();
    controller.setPlayClip(play);
    tutorSpeaks();
    await flush();
    h.live.sendRealtimeInput.mockClear();

    toolCall("play_clip", { sentence: 2 });
    await flush();

    expect(play).toHaveBeenCalledWith(4000, 8000);
    expect(h.live.sendToolResponse.mock.calls.at(-1)![0].functionResponses[0].response.ok).toBe(true);
    expect(controller.getState().playingClip).toBe(false);
    h.onChunk!(new Int16Array(10)); // đuôi âm thanh của video chưa được gửi cho gia sư
    expect(h.live.sendRealtimeInput).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    h.onChunk!(new Int16Array(10));
    expect(h.live.sendRealtimeInput).toHaveBeenCalledTimes(1);
  });

  it("câu không có hoặc video không phát được: báo lỗi để gia sư hỏi tiếp bình thường", async () => {
    const controller = await openLive();
    controller.setPlayClip(vi.fn().mockResolvedValue(false));
    tutorSpeaks();
    await flush();

    toolCall("play_clip", { sentence: 99 });
    await flush();
    expect(h.live.sendToolResponse.mock.calls.at(-1)![0].functionResponses[0].response.error).toBeTruthy();

    toolCall("play_clip", { sentence: 1 });
    await flush();
    expect(h.live.sendToolResponse.mock.calls.at(-1)![0].functionResponses[0].response.error).toBeTruthy();
  });

  it("chỉ cho phát lại tối đa 3 lần mỗi cuộc trò chuyện", async () => {
    const play = vi.fn().mockResolvedValue(true);
    const controller = await openLive();
    controller.setPlayClip(play);
    tutorSpeaks();
    await flush();

    for (let i = 0; i < 4; i++) {
      toolCall("play_clip", { sentence: 1 });
      await flush();
      await vi.advanceTimersByTimeAsync(2_000);
    }

    expect(play).toHaveBeenCalledTimes(3);
    expect(h.live.sendToolResponse.mock.calls.at(-1)![0].functionResponses[0].response.error).toBeTruthy();
  });
});

describe("người học bấm nghe lại video", () => {
  const askWithSentence = async (play: PlayClip, sentence?: number) => {
    api.liveQuestion.mockResolvedValue(session([msg(1, "tutor")]));
    const controller = await openLive();
    controller.setPlayClip(play);
    tutorSpeaks();
    toolCall("next_question", { question: "Q?", ...(sentence ? { sentence } : {}) });
    await flush();
    h.live.sendRealtimeInput.mockClear();
    return controller;
  };

  it("câu hỏi gắn với một câu của bài: phát ngay đoạn đó rồi báo gia sư, mỗi câu hỏi một lần", async () => {
    const play = vi.fn().mockResolvedValue(true);
    const controller = await askWithSentence(play, 2);
    expect(controller.getState().questionClipN).toBe(2);

    await controller.replayClip();

    expect(play).toHaveBeenCalledWith(4000, 8000);
    expect(h.live.sendRealtimeInput).toHaveBeenCalledWith({ text: expect.stringContaining("câu 2") });
    expect(controller.getState().replayUsed).toBe(true);
    await controller.replayClip(); // lần hai cho cùng câu hỏi bị bỏ qua
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("câu hỏi mới mở lại lượt nghe lại và không tính vào 3 lần của gia sư", async () => {
    const play = vi.fn().mockResolvedValue(true);
    const controller = await askWithSentence(play, 1);
    await controller.replayClip();
    api.liveQuestion.mockResolvedValue(session([msg(1, "tutor"), msg(2, "student"), msg(3, "tutor")]));
    toolCall("next_question", { question: "Q2?", sentence: 2 });
    await flush();

    expect(controller.getState().replayUsed).toBe(false);
    expect(controller.getState().questionClipN).toBe(2);
    for (let i = 0; i < 3; i++) {
      toolCall("play_clip", { sentence: 1 });
      await flush();
      await vi.advanceTimersByTimeAsync(2_000);
    }
    expect(play).toHaveBeenCalledTimes(4); // một lần bấm tay và ba lần gia sư
  });

  it("câu hỏi không gắn câu nào: nhờ gia sư chọn đoạn thay vì tự phát", async () => {
    const play = vi.fn().mockResolvedValue(true);
    const controller = await askWithSentence(play);
    expect(controller.getState().questionClipN).toBeNull();

    await controller.replayClip();

    expect(play).not.toHaveBeenCalled();
    expect(h.live.sendRealtimeInput).toHaveBeenCalledWith({ text: expect.stringContaining("play_clip") });
  });

  it("số câu không có trong bài thì coi như không gắn câu nào", async () => {
    const controller = await askWithSentence(vi.fn().mockResolvedValue(true), 99);
    expect(controller.getState().questionClipN).toBeNull();
  });

  it("video không phát được: không báo gia sư và cho bấm lại", async () => {
    const play = vi.fn().mockResolvedValue(false);
    const controller = await askWithSentence(play, 1);

    await controller.replayClip();

    expect(controller.getState().replayUsed).toBe(false);
    expect(h.live.sendRealtimeInput).not.toHaveBeenCalled();
  });

  it("chưa có câu hỏi chờ trả lời thì không phát", async () => {
    const play = vi.fn().mockResolvedValue(true);
    const controller = await openLive();
    controller.setPlayClip(play);

    await controller.replayClip();

    expect(play).not.toHaveBeenCalled();
  });

  it("video bên cạnh đang phát (người học tự bấm): không gửi micro, và còn khóa thêm một đoạn đuôi", async () => {
    const controller = await openLive();
    h.live.sendRealtimeInput.mockClear();

    controller.setExternalAudio(true);
    h.onChunk!(new Int16Array(10));
    expect(h.live.sendRealtimeInput).not.toHaveBeenCalled();

    controller.setExternalAudio(false);
    h.onChunk!(new Int16Array(10));
    expect(h.live.sendRealtimeInput).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    h.onChunk!(new Int16Array(10));
    expect(h.live.sendRealtimeInput).toHaveBeenCalledTimes(1);
  });
});

describe("tra từ trong lúc trò chuyện", () => {
  it("bấm trong khung chat đặt lại bộ đếm im lặng, gia sư chưa hỏi \"bạn còn đó không\"", async () => {
    const controller = await openLive();
    tutorSpeaks();
    await flush();
    h.live.sendRealtimeInput.mockClear();
    const asks = () => h.live.sendRealtimeInput.mock.calls.filter(([arg]) => arg.text?.includes("im lặng")).length;

    await vi.advanceTimersByTimeAsync(50_000);
    controller.noteActivity(); // đang đọc nghĩa của một từ
    await vi.advanceTimersByTimeAsync(50_000);
    expect(asks()).toBe(0); // chưa đủ 60 giây kể từ lần bấm cuối

    await vi.advanceTimersByTimeAsync(11_000);
    expect(asks()).toBe(1);
  });
});

describe("micro và gợi ý", () => {
  it("tắt micro thì không gửi âm thanh cho gia sư", async () => {
    const controller = await openLive();
    h.live.sendRealtimeInput.mockClear();

    h.onChunk!(new Int16Array(10));
    expect(h.live.sendRealtimeInput).toHaveBeenCalledTimes(1);

    controller.setMuted(true);
    h.onChunk!(new Int16Array(10));
    expect(h.live.sendRealtimeInput).toHaveBeenCalledTimes(1);
  });

  it("gợi ý hiện trên câu hỏi hiện tại và nhờ gia sư nói lại", async () => {
    api.liveQuestion.mockResolvedValue(session([msg(1, "tutor")]));
    api.hint.mockResolvedValue({ hint: "Dùng 'He is ...'", cached: false });
    const controller = await openLive();
    tutorSpeaks();
    toolCall("next_question", { question: "Q?" });
    await flush();

    await controller.askHint();

    expect(api.hint).toHaveBeenCalledWith("l1", "s1");
    expect(controller.getState().messages[0].hint).toBe("Dùng 'He is ...'");
    expect(h.live.sendRealtimeInput).toHaveBeenLastCalledWith({ text: expect.stringContaining("Dùng 'He is ...'") });
  });

  it("chưa có câu hỏi thì không xin gợi ý", async () => {
    const controller = await openLive();

    await controller.askHint();

    expect(api.hint).not.toHaveBeenCalled();
  });
});

describe("errorCode", () => {
  it("đọc mã lỗi của server, không phải lỗi HTTP thì coi là mất mạng", () => {
    expect(errorCode(apiError("QUOTA_EXCEEDED"))).toBe("QUOTA_EXCEEDED");
    expect(errorCode(new Error("x"))).toBe("NETWORK_ERROR");
  });
});
