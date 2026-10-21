import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";
import { TutorSessionController } from "./controller";
import type { CreatedSession } from "./types";

// Gemini, micro và loa là thật khi chạy app; ở đây thay bằng bản giả để kiểm các nhánh lỗi của controller.
const h = vi.hoisted(() => ({
  live: { sendRealtimeInput: vi.fn(), sendToolResponse: vi.fn(), close: vi.fn() },
  callbacks: null as null | { onmessage: (m: unknown) => void; onclose: () => void },
  onChunk: null as null | ((pcm: Int16Array) => void),
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
      h.onChunk = onChunk;
      return { stop: vi.fn() };
    },
  },
  encodeWav: () => new Blob(),
  int16Level: () => 0,
  totalSamples: (chunks: Int16Array[]) => chunks.reduce((n, c) => n + c.length, 0),
}));
vi.mock("./audio", () => ({
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
// api.ts kéo theo axiosClient (store đăng nhập, i18n cần document); giữ lại TutorApiError và toTutorError thật
vi.mock("@/api/axiosClient", () => ({ axiosClient: {} }));
vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  createSession: vi.fn(),
  markStarted: vi.fn(),
  uploadAttempt: vi.fn(),
  getSession: vi.fn(),
  endSession: vi.fn(),
  postTopic: vi.fn(),
  switchWord: vi.fn(),
}));

const session: CreatedSession = {
  sessionId: "s1",
  token: "tok",
  model: "live-model",
  tokenExpiresAt: "2026-10-21T10:00:00Z",
  words: [{ word: "things", phoneme: "θ", baseline: 54, attempts: 0, status: "pending" }],
  currentWord: "things",
  limits: {
    maxSeconds: 600,
    wrapUpAtSeconds: 540,
    startTimeoutSeconds: 15,
    maxAttemptsPerWord: 3,
    maxSentenceAttempts: 3,
    idleAskSeconds: 60,
    idleEndSeconds: 90,
    offTopicEndStreak: 3,
  },
};

const tutorSpeaks = () =>
  h.callbacks!.onmessage({ serverContent: { modelTurn: { parts: [{ inlineData: { data: "AAAA" } }] } } });

/** Mở phiên đến khi gia sư đang trò chuyện (phase live). */
async function openLive(): Promise<TutorSessionController> {
  const controller = new TutorSessionController({ attemptId: 7, offerId: null });
  await controller.start();
  expect(controller.getState().phase).toBe("live");
  return controller;
}

/** Người học giữ nút đọc một giây rồi thả: gửi một Lượt chấm cả câu. */
async function holdAndRelease(controller: TutorSessionController) {
  controller.startScoring("sentence");
  controller.startHolding();
  h.onChunk!(new Int16Array(16000));
  await controller.stopHolding();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(api.createSession).mockResolvedValue(session);
  vi.mocked(api.markStarted).mockResolvedValue();
  vi.mocked(api.endSession).mockImplementation(async (_id, outcome) => outcome);
});

afterEach(() => vi.useRealTimers());

describe("server từ chối started", () => {
  it("hết lượt giữa chừng: dừng, vào dự phòng kèm mã lỗi và không nói chuyện tiếp", async () => {
    vi.mocked(api.markStarted).mockRejectedValue(new api.TutorApiError("hết lượt", 429, "QUOTA_EXCEEDED"));
    const controller = await openLive();

    tutorSpeaks();
    await vi.advanceTimersByTimeAsync(0);

    const state = controller.getState();
    expect(state.phase).toBe("fallback");
    expect(state.outcome).toBe("connect_failed");
    expect(state.fallbackCode).toBe("QUOTA_EXCEEDED");
    expect(h.live.close).toHaveBeenCalled();
    expect(api.endSession).not.toHaveBeenCalled(); // server đã tự đóng phiên
  });

  it("lỗi mạng khi báo started chỉ cảnh báo, phiên vẫn tiếp tục", async () => {
    vi.mocked(api.markStarted).mockRejectedValue(new api.TutorApiError("offline", 0, "NETWORK_ERROR"));
    const controller = await openLive();

    tutorSpeaks();
    await vi.advanceTimersByTimeAsync(0);

    expect(controller.getState().phase).toBe("live");
  });
});

describe("Lượt chấm bị server trả 409", () => {
  const conflict = () => new api.TutorApiError("Phiên đã kết thúc", 409, "TUTOR_SESSION_CONFLICT", "Chỉ dẫn");

  it("phiên đã bị server đóng (hết giờ phía backend): kết thúc với kết quả của server", async () => {
    vi.mocked(api.uploadAttempt).mockRejectedValue(conflict());
    vi.mocked(api.getSession).mockResolvedValue({ outcome: "timeout" });
    const controller = await openLive();
    tutorSpeaks();

    await holdAndRelease(controller);
    await vi.advanceTimersByTimeAsync(0);

    expect(api.endSession).toHaveBeenCalledWith("s1", "timeout");
    expect(controller.getState().phase).toBe("ended");
    expect(controller.getState().outcome).toBe("timeout");
  });

  it("phiên còn mở (đổi từ trong lúc chấm): quay lại trò chuyện, không kết thúc", async () => {
    vi.mocked(api.uploadAttempt).mockRejectedValue(conflict());
    vi.mocked(api.getSession).mockResolvedValue({ outcome: null });
    const controller = await openLive();
    tutorSpeaks();

    await holdAndRelease(controller);
    await vi.advanceTimersByTimeAsync(0);

    const state = controller.getState();
    expect(state.phase).toBe("live");
    expect(state.notice).toEqual({ code: "server", message: "Phiên đã kết thúc" });
    expect(api.endSession).not.toHaveBeenCalled();
    expect(h.live.sendRealtimeInput).toHaveBeenLastCalledWith({
      text: expect.stringContaining("Chỉ dẫn"),
    });
  });
});

describe("không kết nối được", () => {
  it("gia sư không nói trong thời gian chờ bắt đầu: đóng phiên connect_failed và vào dự phòng với mẹo chữ", async () => {
    const controller = await openLive();

    await vi.advanceTimersByTimeAsync(session.limits.startTimeoutSeconds * 1000);

    const state = controller.getState();
    expect(api.endSession).toHaveBeenCalledWith("s1", "connect_failed");
    expect(state.phase).toBe("fallback");
    expect(state.fallbackWords.map((w) => w.word)).toEqual(["things"]);
  });
});
