import { GoogleGenAI, Modality } from "@google/genai";
import type { FunctionCall, LiveServerMessage, Session } from "@google/genai";
import { PcmPlayer, int16ToBase64 } from "@/features/tutor/audio";
import { MIC_RATE, MicCapture, int16Level } from "@/lib/pcmRecorder";
import type { CreditBalance } from "@/features/subscription/types";
import type { AiChatApi } from "./api";
import { asText, tick } from "./rules";
import type { ChatLimits, ChatMessage, ChatSession } from "./types";

export type Phase = "idle" | "connecting" | "live" | "ending" | "ended" | "fallback";

export type LiveChatState = {
  phase: Phase;
  limits: ChatLimits | null;
  /** Credit sẽ trừ khi gia sư nói câu đầu. */
  cost: number;
  /** Câu hỏi và câu trả lời đã được server ghi lại, kèm nhận xét và gợi ý. */
  messages: ChatMessage[];
  answered: number;
  elapsedSeconds: number;
  muted: boolean;
  tutorSpeaking: boolean;
  /** Phụ đề trực tiếp của lượt đang nói, mỗi bên một dòng. */
  captions: { tutor: string; learner: string };
  hintLoading: boolean;
  /** Phiên sau khi kết thúc: có nhận xét tổng quát nếu tạo được. */
  finalSession: ChatSession | null;
  /** Đã trả lời nhưng chưa tạo được nhận xét tổng quát: cho bấm tạo lại. */
  summaryFailed: boolean;
  /** Mã lỗi khi không mở được phiên (QUOTA_EXCEEDED, AI_CHAT_LIVE_UNAVAILABLE, MIC_UNAVAILABLE...). */
  fallbackCode: string | null;
  fallbackReason: string | null;
};

export type LiveChatParams = {
  lessonId: string;
  api: Pick<AiChatApi, "startLive" | "liveStarted" | "liveQuestion" | "liveFeedback" | "liveFinish" | "hint" | "detail">;
  /** Số dư mới sau khi trừ credit của phiên. */
  onCredit?: (balance: CreditBalance) => void;
};

const KICKOFF_TEXT = "[Hệ thống] Người học đã vào phiên. Hãy bắt đầu theo quy trình.";
const WRAP_UP_TEXT =
  "[Hệ thống] Còn khoảng 1 phút nữa là hết thời gian. Hãy nhận xét ngắn câu vừa rồi, chào kết trong 1-2 câu rồi gọi " +
  "end_session. Đừng hỏi thêm câu mới.";
const IDLE_ASK_TEXT =
  "[Hệ thống] Người học im lặng đã lâu. Hãy hỏi ngắn gọn một câu xem họ còn muốn tiếp tục không; nếu họ vẫn im lặng " +
  "thì phiên sẽ kết thúc.";
const NUDGE_QUESTION_TEXT =
  "[Hệ thống] Bạn vừa nói xong mà chưa gọi tool next_question. Hãy gọi next_question ngay với câu hỏi vừa nói (đừng " +
  "nói tên tool ra lời); nếu chưa hỏi gì thì hỏi câu mới rồi gọi tool.";
const NUDGE_END_TEXT = "[Hệ thống] Đã đủ số câu hỏi. Hãy gọi end_session ngay (đừng nói tên tool ra lời).";
const NUDGE_AFTER_MS = 7000;
const MAX_NUDGES = 3;
const DRAIN_MAX_MS = 5000;

/** Mã lỗi của server trong lỗi axios; không phải lỗi HTTP thì coi là mất mạng. */
export function errorCode(err: unknown): string {
  const e = err as { response?: { data?: { code?: string } } } | null;
  return e?.response ? (e.response.data?.code ?? "INTERNAL_ERROR") : "NETWORK_ERROR";
}

const INITIAL: LiveChatState = {
  phase: "idle",
  limits: null,
  cost: 0,
  messages: [],
  answered: 0,
  elapsedSeconds: 0,
  muted: false,
  tutorSpeaking: false,
  captions: { tutor: "", learner: "" },
  hintLoading: false,
  finalSession: null,
  summaryFailed: false,
  fallbackCode: null,
  fallbackReason: null,
};

/**
 * Điều khiển một phiên Thực hành với AI theo bài ở chế độ giọng nói: xin token qua backend, nói chuyện trực tiếp với
 * Gemini Live, thực thi trần 15 phút và xử lý im lặng, và báo từng câu hỏi, câu trả lời, nhận xét của gia sư cho server
 * qua các tool. Micro mở liên tục. Không phụ thuộc React; dùng qua useLiveChat.
 */
export class LiveChatController {
  #params: LiveChatParams;
  #state: LiveChatState = INITIAL;
  #listeners = new Set<() => void>();

  #sessionId: string | null = null;
  #live: Session | null = null;
  #mic: MicCapture | null = null;
  #player: PcmPlayer | null = null;
  #micLevel = 0;

  #started = false;
  #finishing = false;
  #startTimer: ReturnType<typeof setTimeout> | null = null;
  #ticker: ReturnType<typeof setInterval> | null = null;
  #lastTick = 0;
  #activeMs = 0;
  #idleMs = 0;
  #idleAsked = false;
  #wrapUpSent = false;
  #wrapUpReplySeen = false;

  /** Tool mà gia sư cần gọi tiếp theo; dùng để nhắc khi gia sư nói mà quên gọi. */
  #expect: "next_question" | "end_session" | null = null;
  #nudgeTimer: ReturnType<typeof setTimeout> | null = null;
  #nudges = 0;

  #lastRole: "tutor" | "learner" | null = null;
  /** Lời học viên chép từ giọng nói trong lượt hiện tại, ưu tiên hơn lời gia sư tự thuật lại. */
  #learnerText = "";
  #toolQueue: Promise<void> = Promise.resolve();

  constructor(params: LiveChatParams) {
    this.#params = params;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  getState = (): LiveChatState => this.#state;

  /** Âm lượng hiện tại (0..1) của người học và gia sư; đọc mỗi khung hình, không đi qua state React. */
  getLevels = (): { learner: number; tutor: number } => ({
    learner: this.#state.muted ? 0 : this.#micLevel,
    tutor: this.#state.tutorSpeaking ? (this.#player?.level() ?? 0) : 0,
  });

  /** Bắt đầu phiên. Gọi từ click của người học để trình duyệt cho phép mic và loa. */
  async start() {
    if (this.#state.phase !== "idle" && this.#state.phase !== "fallback") return;
    this.#resetRuntime();
    this.#set({ ...INITIAL, phase: "connecting" });

    // Xin quyền mic trước khi tạo phiên: token chỉ có hiệu lực ngắn
    try {
      this.#mic = await MicCapture.create((pcm) => this.#onMicChunk(pcm));
      this.#player = new PcmPlayer((speaking) => this.#set({ tutorSpeaking: speaking }));
      await this.#player.resume();
    } catch (err) {
      this.#teardown();
      this.#set({ phase: "fallback", fallbackCode: "MIC_UNAVAILABLE", fallbackReason: errorMessage(err) });
      return;
    }
    if (this.#finishing) {
      this.#teardown();
      return;
    }

    let created: Awaited<ReturnType<LiveChatParams["api"]["startLive"]>>;
    try {
      created = await this.#params.api.startLive(this.#params.lessonId);
    } catch (err) {
      this.#teardown();
      this.#set({ phase: "fallback", fallbackCode: errorCode(err), fallbackReason: errorMessage(err) });
      return;
    }
    if (this.#finishing) {
      this.#teardown();
      return;
    }

    this.#sessionId = created.id;
    this.#set({ limits: created.limits, cost: created.cost });
    this.#params.onCredit?.(created.balance);
    this.#startTimer = setTimeout(
      () => void this.#connectFailed("START_TIMEOUT"),
      created.limits.startTimeoutSeconds * 1000,
    );

    try {
      const ai = new GoogleGenAI({ apiKey: created.token, httpOptions: { apiVersion: "v1alpha" } });
      // Model, prompt, tools đã khóa trong token; chỉ khai báo kênh trả lời
      this.#live = await ai.live.connect({
        model: created.model,
        config: { responseModalities: [Modality.AUDIO] },
        callbacks: {
          onmessage: (message) => this.#onMessage(message),
          onerror: (event) => console.error("Gemini Live error", event),
          onclose: () => void this.#onClose(),
        },
      });
    } catch (err) {
      await this.#connectFailed("CONNECT_ERROR", errorMessage(err));
      return;
    }
    if (this.#finishing) {
      this.#teardown();
      return;
    }
    this.#expect = "next_question";
    this.#set({ phase: "live" });
    this.#live.sendRealtimeInput({ text: KICKOFF_TEXT });
  }

  /** Người học bấm Kết thúc hoặc rời trang. */
  leave() {
    const { phase } = this.#state;
    if (phase === "idle" || phase === "ended" || phase === "fallback" || phase === "ending") {
      this.#teardown();
      return;
    }
    if (this.#started) void this.#finish();
    else void this.#abort();
  }

  /** Gọi khi component bị gỡ. */
  dispose() {
    this.leave();
  }

  setMuted(muted: boolean) {
    this.#set({ muted });
    this.#learnerActivity();
  }

  /** Xin gợi ý (miễn phí): hiện chữ trên màn hình và nhờ gia sư nói lại bằng giọng. */
  async askHint() {
    const sessionId = this.#sessionId;
    const last = this.#state.messages.at(-1);
    if (!sessionId || this.#state.phase !== "live" || this.#state.hintLoading || last?.role !== "tutor" || last.hint) return;
    this.#learnerActivity();
    this.#set({ hintLoading: true });
    try {
      const { hint } = await this.#params.api.hint(this.#params.lessonId, sessionId);
      if (this.#finishing) return;
      this.#set({
        messages: this.#state.messages.map((m) => (m.id === last.id ? { ...m, hint } : m)),
        hintLoading: false,
      });
      this.#live?.sendRealtimeInput({
        text:
          "[Hệ thống] Người học vừa bấm nút Gợi ý. Hãy nói lại ngắn gọn gợi ý sau bằng tiếng Việt (đừng nói thêm đáp án, " +
          `đừng gọi tool): ${hint}`,
      });
    } catch (err) {
      console.warn("hint failed", err);
      this.#set({ hintLoading: false });
    }
  }

  /** Tạo lại nhận xét tổng quát khi lần trước lỗi. */
  async retrySummary() {
    if (this.#state.phase !== "ended" || !this.#state.summaryFailed) return;
    this.#set({ summaryFailed: false, phase: "ending" });
    await this.#closeOnServer();
  }

  // --- tin nhắn từ Gemini Live ---

  #onMessage(message: LiveServerMessage) {
    if (this.#finishing) return;
    const content = message.serverContent;
    if (content) {
      if (content.interrupted) this.#player?.flush();
      for (const part of content.modelTurn?.parts ?? []) {
        if (part.inlineData?.data) {
          this.#onTutorOutput();
          this.#player?.enqueue(part.inlineData.data);
        }
      }
      if (content.inputTranscription?.text) {
        this.#clearNudge();
        this.#learnerActivity();
        this.#pushCaption("learner", content.inputTranscription.text);
      }
      if (content.outputTranscription?.text) {
        this.#onTutorOutput();
        this.#pushCaption("tutor", content.outputTranscription.text);
      }
      if (content.turnComplete) {
        if (this.#wrapUpSent && this.#wrapUpReplySeen) void this.#finish({ drain: true });
        else this.#armNudge();
      }
    }

    // Server báo sắp ngắt kết nối (giới hạn kết nối của Gemini): chốt phiên sớm
    if (message.goAway) this.#sendWrapUp();

    if (message.toolCall?.functionCalls?.length) this.#clearNudge();
    for (const call of message.toolCall?.functionCalls ?? []) {
      // Xử lý tuần tự để thứ tự phản hồi tool đúng thứ tự gọi
      this.#toolQueue = this.#toolQueue.then(() => this.#handleToolCall(call)).catch(console.error);
    }
  }

  #onTutorOutput() {
    this.#clearNudge();
    if (this.#wrapUpSent) this.#wrapUpReplySeen = true;
    if (this.#started) return;
    this.#started = true;
    if (this.#startTimer) clearTimeout(this.#startTimer);
    this.#startTimer = null;
    this.#lastTick = performance.now();
    this.#ticker = setInterval(() => this.#onTick(), 250);
    const { lessonId, api } = this.#params;
    if (this.#sessionId) {
      api
        .liveStarted(lessonId, this.#sessionId)
        .then((credit) => this.#params.onCredit?.(credit.balance))
        .catch((err) => this.#startRejected(err));
    }
  }

  /** Server từ chối `started` (hết lượt giữa chừng ở tab khác): server đã đóng phiên nên chỉ dừng và báo. */
  #startRejected(err: unknown) {
    const code = errorCode(err);
    if (this.#finishing || code === "NETWORK_ERROR") {
      console.warn("liveStarted failed", err);
      return;
    }
    this.#finishing = true;
    this.#teardown();
    this.#set({ phase: "fallback", fallbackCode: code, fallbackReason: errorMessage(err) });
  }

  async #onClose() {
    if (this.#finishing) return;
    if (!this.#started) await this.#connectFailed("CONNECTION_CLOSED");
    else await this.#finish();
  }

  // --- tool call của gia sư ---

  async #handleToolCall(call: FunctionCall) {
    if (this.#finishing || !call.name) return;
    const id = call.id ?? null;
    const args = (call.args ?? {}) as Record<string, unknown>;
    const sessionId = this.#sessionId;
    if (!sessionId) return;
    const { lessonId, api } = this.#params;

    switch (call.name) {
      case "next_question": {
        try {
          const session = await api.liveQuestion(lessonId, sessionId, asText(args.question));
          if (this.#finishing) return;
          this.#expect = null;
          this.#applySession(session);
          this.#respond(id, call.name, { ok: true, question_number: session.messages.filter((m) => m.role === "tutor").length });
        } catch (err) {
          const code = errorCode(err);
          if (code === "AI_CHAT_QUESTION_LIMIT") {
            this.#expect = "end_session";
            this.#respond(id, call.name, {
              error: "Đã đủ số câu hỏi.",
              instruction: "Đừng hỏi thêm. Chào kết ngắn gọn rồi gọi end_session.",
            });
          } else if (code === "AI_CHAT_TURN_CONFLICT") {
            this.#respond(id, call.name, {
              error: "Câu hỏi trước chưa được trả lời.",
              instruction: "Chờ người học trả lời câu hỏi hiện tại, đừng hỏi câu mới.",
            });
          } else if (code === "AI_CHAT_NOT_ACTIVE") {
            await this.#finish();
          } else {
            this.#respond(id, call.name, { error: "Không ghi được câu hỏi.", instruction: "Cứ hỏi tiếp bình thường." });
          }
        }
        break;
      }
      case "give_feedback": {
        const answer = this.#learnerText.trim() || asText(args.answer);
        try {
          const session = await api.liveFeedback(lessonId, sessionId, {
            answer,
            feedback: asText(args.feedback),
            better: asText(args.better),
          });
          if (this.#finishing) return;
          const full = session.answered >= (this.#state.limits?.maxQuestions ?? session.maxQuestions);
          this.#expect = full ? "end_session" : "next_question";
          this.#applySession(session);
          this.#respond(id, call.name, {
            ok: true,
            answered: session.answered,
            instruction: full
              ? "Đây là câu cuối. Nhận xét ngắn rồi chào kết và gọi end_session."
              : "Nhận xét ngắn gọn bằng giọng, rồi gọi next_question và đọc to câu hỏi mới.",
          });
        } catch (err) {
          const code = errorCode(err);
          if (code === "AI_CHAT_NOT_ACTIVE") {
            await this.#finish();
          } else {
            this.#respond(id, call.name, {
              error: "Không ghi được nhận xét.",
              instruction: "Cứ nhận xét bằng giọng rồi hỏi tiếp bình thường.",
            });
          }
        }
        break;
      }
      case "end_session": {
        this.#respond(id, call.name, { ok: true });
        await this.#finish({ drain: true });
        break;
      }
      default:
        this.#respond(id, call.name, { error: `Không có tool ${call.name}.` });
    }
  }

  #applySession(session: ChatSession) {
    // Giữ gợi ý đã hiện cho câu hỏi hiện tại (server cũng đã lưu nên khớp)
    this.#learnerText = "";
    this.#set({ messages: session.messages, answered: session.answered });
  }

  #respond(id: string | null, name: string, response: Record<string, unknown>) {
    if (!this.#live || this.#finishing) return;
    try {
      this.#live.sendToolResponse({ functionResponses: [{ id: id ?? undefined, name, response }] });
    } catch (err) {
      console.warn("sendToolResponse failed", err);
    }
  }

  // --- mic, đồng hồ ---

  #onMicChunk(pcm: Int16Array) {
    this.#micLevel = int16Level(pcm);
    if (this.#state.phase === "live" && this.#live && !this.#finishing && !this.#state.muted) {
      try {
        this.#live.sendRealtimeInput({ audio: { data: int16ToBase64(pcm), mimeType: `audio/pcm;rate=${MIC_RATE}` } });
      } catch (err) {
        console.warn("sendRealtimeInput failed", err);
      }
    }
  }

  /** Mỗi 250 ms: tính giờ, chốt ở trần 15 phút, nhắc chốt lại trước trần, và xử lý im lặng. */
  #onTick() {
    const limits = this.#state.limits;
    if (!limits || this.#finishing) return;
    const now = performance.now();
    const dt = now - this.#lastTick;
    this.#lastTick = now;

    const next = tick({
      activeMs: this.#activeMs,
      idleMs: this.#idleMs,
      idleAsked: this.#idleAsked,
      wrapUpSent: this.#wrapUpSent,
      dtMs: dt,
      tutorSpeaking: this.#state.tutorSpeaking,
      limits,
    });
    this.#activeMs = next.activeMs;
    this.#idleMs = next.idleMs;
    this.#idleAsked = next.idleAsked;
    this.#set({ elapsedSeconds: next.seconds });

    for (const action of next.actions) {
      if (action === "timeout") void this.#finish();
      else if (action === "wrapUp") this.#sendWrapUp();
      else if (action === "idleAsk") this.#live?.sendRealtimeInput({ text: IDLE_ASK_TEXT });
      else void this.#finish();
    }
  }

  #sendWrapUp() {
    if (this.#wrapUpSent || this.#state.phase !== "live") return;
    this.#wrapUpSent = true;
    this.#expect = null;
    this.#live?.sendRealtimeInput({ text: WRAP_UP_TEXT });
  }

  /** Người học vừa làm gì đó (nói, bấm): xoá bộ đếm im lặng. */
  #learnerActivity() {
    this.#idleMs = 0;
    this.#idleAsked = false;
  }

  /** Gia sư nói xong lượt mà chưa gọi tool cần gọi: nhắc sau NUDGE_AFTER_MS, tối đa MAX_NUDGES lần. */
  #armNudge() {
    this.#clearNudge();
    if (!this.#expect || this.#wrapUpSent || this.#state.phase !== "live") return;
    this.#nudgeTimer = setTimeout(() => {
      this.#nudgeTimer = null;
      if (this.#state.phase !== "live" || this.#finishing || this.#state.tutorSpeaking || !this.#live || !this.#expect) return;
      if (this.#nudges >= MAX_NUDGES) {
        // Gia sư mãi không gọi: nếu đã đủ câu thì tự kết thúc để không treo
        if (this.#expect === "end_session") void this.#finish({ drain: true });
        return;
      }
      this.#nudges++;
      this.#live.sendRealtimeInput({ text: this.#expect === "end_session" ? NUDGE_END_TEXT : NUDGE_QUESTION_TEXT });
    }, NUDGE_AFTER_MS);
  }

  #clearNudge() {
    if (this.#nudgeTimer) clearTimeout(this.#nudgeTimer);
    this.#nudgeTimer = null;
  }

  // --- phụ đề ---

  #pushCaption(role: "tutor" | "learner", text: string) {
    const fresh = this.#lastRole !== role;
    this.#lastRole = role;
    if (role === "learner") this.#learnerText = fresh ? text : this.#learnerText + text;
    const prev = fresh ? "" : this.#state.captions[role];
    this.#set({ captions: { ...this.#state.captions, [role]: prev + text } });
  }

  // --- kết thúc ---

  /** Chưa nghe gia sư nói gì (không nối được hoặc quá thời gian chờ): vào dự phòng chat chữ. */
  async #connectFailed(code: string, detail: string | null = null) {
    if (this.#started || this.#finishing) return;
    this.#finishing = true;
    this.#teardown();
    this.#set({ phase: "fallback", fallbackCode: code, fallbackReason: detail });
  }

  /** Người học thoát trước khi gia sư kịp nói câu đầu: chưa trừ credit, không cần tổng kết. */
  async #abort() {
    if (this.#finishing) return;
    this.#finishing = true;
    this.#teardown();
    this.#set({ phase: "idle" });
  }

  /** Mọi lý do kết thúc (đủ câu, hết giờ, im lặng, người học thoát) đi cùng một đường: server tạo nhận xét theo số câu đã trả lời. */
  async #finish(options: { drain?: boolean } = {}) {
    if (this.#finishing) return;
    this.#finishing = true;
    this.#stopTimers();
    this.#set({ phase: "ending" });
    if (options.drain) await this.#player?.whenIdle(DRAIN_MAX_MS);
    this.#teardownMedia();
    await this.#closeOnServer();
  }

  async #closeOnServer() {
    const sessionId = this.#sessionId;
    if (!sessionId) {
      this.#set({ phase: "ended" });
      return;
    }
    const { lessonId, api } = this.#params;
    try {
      const turn = await api.liveFinish(lessonId, sessionId);
      this.#params.onCredit?.(turn.credit.balance);
      this.#set({ phase: "ended", finalSession: turn.session, messages: turn.session.messages, answered: turn.session.answered });
    } catch (err) {
      if (errorCode(err) === "AI_CHAT_NOT_ACTIVE") {
        const session = await api.detail(lessonId, sessionId).catch(() => null);
        this.#set({ phase: "ended", finalSession: session });
        return;
      }
      // Nhận xét tổng quát chưa tạo được (Gemini lỗi, mất mạng): các câu trả lời đã lưu, cho bấm tạo lại
      this.#set({ phase: "ended", summaryFailed: this.#state.answered >= 1 });
    }
  }

  #stopTimers() {
    if (this.#startTimer) clearTimeout(this.#startTimer);
    if (this.#ticker) clearInterval(this.#ticker);
    this.#startTimer = null;
    this.#ticker = null;
    this.#clearNudge();
  }

  #teardownMedia() {
    this.#mic?.stop();
    this.#player?.close();
    this.#mic = null;
    this.#player = null;
    const live = this.#live;
    this.#live = null;
    try {
      live?.close();
    } catch {
      // đã đóng
    }
  }

  #teardown() {
    this.#stopTimers();
    this.#teardownMedia();
  }

  #resetRuntime() {
    this.#sessionId = null;
    this.#started = false;
    this.#finishing = false;
    this.#activeMs = 0;
    this.#idleMs = 0;
    this.#idleAsked = false;
    this.#wrapUpSent = false;
    this.#wrapUpReplySeen = false;
    this.#expect = null;
    this.#nudges = 0;
    this.#lastRole = null;
    this.#learnerText = "";
    this.#toolQueue = Promise.resolve();
  }

  #set(patch: Partial<LiveChatState>) {
    const next = { ...this.#state, ...patch };
    const changed = (Object.keys(patch) as Array<keyof LiveChatState>).some((key) => next[key] !== this.#state[key]);
    if (!changed) return;
    this.#state = next;
    this.#listeners.forEach((listener) => listener());
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
