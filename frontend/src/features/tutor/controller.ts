import { GoogleGenAI, Modality } from "@google/genai";
import type { FunctionCall, LiveServerMessage, Session } from "@google/genai";
import { MIC_RATE, MicCapture, encodeWav, int16Level, totalSamples } from "@/lib/pcmRecorder";
import * as api from "./api";
import { PcmPlayer, int16ToBase64 } from "./audio";
import { parseOutcome, parseTarget, parseTopic, tick } from "./rules";
import type { Phase } from "./rules";
import type {
  AttemptResult,
  AttemptTarget,
  PracticeWord,
  SessionOutcome,
  TutorLimits,
  TutorTurn,
  WordView,
} from "./types";

export type { Phase };

export type TutorState = {
  phase: Phase;
  /** Tiến độ từng từ trong phiên (Danh sách từ lỗi, cộng các từ người học tự chọn). */
  words: WordView[];
  /** Từ đang luyện; null khi chưa có (câu đọc tốt, người học chưa chọn từ). */
  currentWord: string | null;
  limits: TutorLimits | null;
  turns: TutorTurn[];
  /** Thời gian đã học (không đếm giờ chờ Azure); không có đếm ngược, trần là limits.maxSeconds. */
  elapsedSeconds: number;
  /** Đích của Lượt chấm đang mở (phase = scoring hoặc assessing). */
  scoringTarget: AttemptTarget | null;
  /** Từ đang được chấm khi scoringTarget = "word". */
  scoringWord: string | null;
  /** Người học đang giữ nút để đọc. */
  holding: boolean;
  tutorSpeaking: boolean;
  /** Số Lượt lạc đề liên tiếp gần nhất, để hiện lời nhắc quay lại bài. */
  offTopicStreak: number;
  outcome: SessionOutcome | null;
  /** Mẹo sửa dạng chữ khi không mở được phiên (phase = fallback). */
  fallbackWords: PracticeWord[];
  fallbackReason: string | null;
  /** Mã lỗi của server khi không mở được phiên (QUOTA_EXCEEDED, TUTOR_TOO_MANY_FAILED_STARTS, AI_CONSENT_REQUIRED...). */
  fallbackCode: string | null;
  /** Lời nhắn tạm thời cho người học (ví dụ giữ nút quá ngắn). */
  notice: string | null;
};

export type TutorParams = {
  /** Lượt shadowing vừa chấm; backend tự đọc kết quả của lượt này. */
  attemptId: number;
  offerId: string | null;
};

type PendingScoring = { callId: string | null; name: string; target: AttemptTarget; word: string | null };

const KICKOFF_TEXT = "[Hệ thống] Người học đã vào phiên. Hãy bắt đầu theo quy trình.";
const WRAP_UP_TEXT =
  "[Hệ thống] Còn khoảng 1 phút nữa là hết thời gian. Hãy chốt lại trong 1–2 câu ngắn (từ nào đã đạt, từ nào " +
  "cần luyện thêm) và mời người học tiếp tục bài. Đừng mở thêm chủ đề.";
const IDLE_ASK_TEXT =
  "[Hệ thống] Người học im lặng đã lâu. Hãy hỏi ngắn gọn một câu xem họ còn muốn luyện tiếp không; " +
  "nếu họ vẫn im lặng thì phiên sẽ kết thúc.";
// Gia sư đôi khi nói "thử lại nhé" mà quên gọi tool nên phiên đứng im; nhắc nhẹ sau một khoảng lặng
const NUDGE_TEXT =
  "[Hệ thống] Bạn vừa nói xong mà chưa gọi tool nào. Nếu cần người học đọc để chấm, hãy gọi request_retry ngay " +
  "(đừng nói tên tool ra lời); nếu phiên đã xong thì gọi end_session.";
const NUDGE_AFTER_MS = 8000;
const MAX_NUDGES = 2;
const MIN_HOLD_SECONDS = 0.4;
const MAX_HOLD_SECONDS = 15;
const DRAIN_MAX_MS = 5000;
const SERVER_END_GRACE_MS = 8000;

const INITIAL_STATE: TutorState = {
  phase: "idle",
  words: [],
  currentWord: null,
  limits: null,
  turns: [],
  elapsedSeconds: 0,
  scoringTarget: null,
  scoringWord: null,
  holding: false,
  tutorSpeaking: false,
  offTopicStreak: 0,
  outcome: null,
  fallbackWords: [],
  fallbackReason: null,
  fallbackCode: null,
  notice: null,
};

/**
 * Điều khiển một Phiên gia sư phía trình duyệt: cấp token qua backend, nói chuyện trực tiếp với Gemini Live,
 * thực thi trần thời gian và xử lý im lặng (ADR 0003) và chuyển Lượt chấm sang backend để Azure chấm.
 * Hai chế độ tách hẳn: trò chuyện (phase live, gia sư nghe) và Lượt chấm (phase scoring, giữ nút để đọc, gia sư
 * không nghe). Không phụ thuộc React; dùng qua useTutorSession.
 */
export class TutorSessionController {
  #params: TutorParams;
  #state: TutorState = INITIAL_STATE;
  #listeners = new Set<() => void>();

  #sessionId: string | null = null;
  #live: Session | null = null;
  #mic: MicCapture | null = null;
  #player: PcmPlayer | null = null;
  #micLevel = 0;

  #started = false;
  #finishing = false;
  /** Backend đã kết thúc phiên (đọc cả câu xong): đóng giao diện sau lượt chào của gia sư. */
  #serverEnded: SessionOutcome | null = null;
  #serverEndedReplySeen = false;
  #serverEndTimer: ReturnType<typeof setTimeout> | null = null;
  #startTimer: ReturnType<typeof setTimeout> | null = null;
  #ticker: ReturnType<typeof setInterval> | null = null;
  #lastTick = 0;
  #activeMs = 0;
  #idleMs = 0;
  #idleAsked = false;
  #wrapUpSent = false;
  #wrapUpReplySeen = false;
  #nudgeTimer: ReturnType<typeof setTimeout> | null = null;
  #nudges = 0;

  #pending: PendingScoring | null = null;
  #holdChunks: Int16Array[] = [];
  #holdTimer: ReturnType<typeof setTimeout> | null = null;

  #openTurn: { id: number; role: "tutor" | "learner" } | null = null;
  #turnSeq = 0;
  #toolQueue: Promise<void> = Promise.resolve();

  constructor(params: TutorParams) {
    this.#params = params;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  getState = (): TutorState => this.#state;

  /** Âm lượng hiện tại (0..1) của người học và gia sư; đọc mỗi khung hình, không đi qua state React. */
  getLevels = (): { learner: number; tutor: number } => ({
    learner: this.#micLevel,
    tutor: this.#state.tutorSpeaking ? (this.#player?.level() ?? 0) : 0,
  });

  /** Bắt đầu phiên. Gọi từ click của người học để trình duyệt cho phép mic và loa. */
  async start() {
    if (this.#state.phase !== "idle" && this.#state.phase !== "fallback") return;
    this.#resetRuntime();
    this.#set({ ...INITIAL_STATE, phase: "connecting" });

    // Xin quyền mic trước khi tạo phiên: token chỉ có hiệu lực ngắn
    try {
      this.#mic = await MicCapture.create((pcm) => this.#onMicChunk(pcm));
      this.#player = new PcmPlayer((speaking) => this.#set({ tutorSpeaking: speaking }));
      await this.#player.resume();
    } catch (err) {
      this.#teardown();
      this.#set({
        phase: "fallback",
        fallbackReason: `Không dùng được micro hoặc loa (${errorMessage(err)}). Hãy cho phép micro rồi thử lại.`,
      });
      return;
    }

    if (this.#finishing) {
      // Người học thoát trong lúc chờ cấp quyền mic
      this.#teardown();
      return;
    }

    let created: Awaited<ReturnType<typeof api.createSession>>;
    try {
      created = await api.createSession(this.#params.attemptId, this.#params.offerId);
    } catch (err) {
      const apiErr = api.toTutorError(err);
      this.#teardown();
      this.#set({
        phase: "fallback",
        fallbackWords: apiErr.words ?? [],
        fallbackReason: apiErr.message,
        fallbackCode: apiErr.code,
      });
      return;
    }

    if (this.#finishing) {
      // Người học thoát trong lúc tạo phiên: đóng phiên vừa tạo để không bị tính
      this.#teardown();
      api.endSession(created.sessionId, "connect_failed").catch((err) => console.warn("endSession failed", err));
      return;
    }

    this.#sessionId = created.sessionId;
    this.#set({ words: created.words, currentWord: created.currentWord ?? null, limits: created.limits });
    this.#startTimer = setTimeout(
      () => void this.#connectFailed("Gia sư chưa phản hồi kịp."),
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
      await this.#connectFailed(`Không kết nối được gia sư (${errorMessage(err)}).`);
      return;
    }

    if (this.#finishing) {
      // Người học thoát trong lúc đang kết nối
      this.#teardown();
      return;
    }
    this.#set({ phase: "live" });
    this.#live.sendRealtimeInput({ text: KICKOFF_TEXT });
  }

  /** "Tiếp tục bài": người học thoát bất cứ lúc nào. */
  leave() {
    if (this.#state.phase === "idle" || this.#state.phase === "ended" || this.#state.phase === "fallback") {
      this.#teardown();
      return;
    }
    void this.#finish(this.#started ? "learner_exit" : "connect_failed");
  }

  /** Gọi khi component bị gỡ. */
  dispose() {
    this.leave();
  }

  // --- hành động của người học ---

  /** Mở Lượt chấm do người học tự bấm (nút 🎯 cho từ đang luyện, hoặc cả câu). */
  startScoring(target: AttemptTarget = "word") {
    const { phase, words, currentWord, limits } = this.#state;
    if (phase !== "live" || !limits) return;
    this.#learnerActivity();

    if (target === "sentence") {
      this.#beginScoring({ callId: null, name: "", target: "sentence", word: null });
      return;
    }
    const current = words.find((w) => w.word === currentWord);
    if (!current) {
      this.#set({ notice: "Hãy bấm vào một từ trong câu để chọn từ cần luyện." });
    } else if (current.attempts >= limits.maxAttemptsPerWord) {
      this.#set({
        notice: `Từ "${current.word}" đã hết ${limits.maxAttemptsPerWord} lượt chấm. Bấm lại vào từ đó để luyện lại với lượt mới, hoặc chọn từ khác.`,
      });
    } else {
      this.#beginScoring({ callId: null, name: "", target: "word", word: current.word });
    }
  }

  /** Người học chọn từ cần luyện (bấm chip). Gia sư được báo qua kết quả tool đang chờ hoặc tin nhắn hệ thống. */
  async chooseWord(word: string) {
    const { phase, holding } = this.#state;
    const sessionId = this.#sessionId;
    if (!sessionId || !(phase === "live" || (phase === "scoring" && !holding))) return;
    this.#learnerActivity();

    try {
      const result = await api.switchWord(sessionId, word);
      if (this.#finishing) return;
      const pending = this.#pending;
      this.#pending = null;
      this.#set({
        words: result.words,
        currentWord: result.currentWord.word,
        phase: "live",
        scoringTarget: null,
        scoringWord: null,
        notice: null,
      });
      if (pending?.callId) {
        this.#respond(pending.callId, pending.name, { cancelled: true, instruction: result.instruction });
      } else {
        this.#live?.sendRealtimeInput({
          text:
            `[Hệ thống] Người học vừa bấm chọn từ "${result.currentWord.word}" trên màn hình; hệ thống đã chuyển từ ` +
            `rồi, đừng gọi switch_word nữa. ${result.instruction}`,
        });
      }
    } catch (err) {
      this.#set({ notice: err instanceof Error ? err.message : "Không đổi được từ." });
    }
  }

  /** Người học huỷ Lượt chấm đang mở và quay lại trò chuyện. */
  cancelScoring() {
    if (this.#state.phase !== "scoring" || this.#state.holding) return;
    const pending = this.#pending;
    this.#pending = null;
    this.#learnerActivity();
    this.#set({ phase: "live", scoringTarget: null, scoringWord: null, notice: null });
    if (pending?.callId) {
      this.#respond(pending.callId, pending.name, {
        cancelled: true,
        instruction: "Người học huỷ lượt chấm. Hỏi họ muốn làm gì tiếp (đổi từ, hỏi thêm, hoặc dừng).",
      });
    }
  }

  /** Người học nhấn giữ nút: bắt đầu ghi âm cho Lượt chấm. */
  startHolding() {
    if (this.#state.phase !== "scoring" || this.#state.holding) return;
    this.#player?.flush(); // tránh thu lại giọng gia sư qua loa
    this.#holdChunks = [];
    this.#learnerActivity();
    this.#set({ holding: true, notice: null });
    this.#holdTimer = setTimeout(() => void this.stopHolding(), MAX_HOLD_SECONDS * 1000);
  }

  /** Người học thả nút: gửi bản ghi cho backend để Azure chấm. */
  async stopHolding() {
    const pending = this.#pending;
    if (this.#state.phase !== "scoring" || !this.#state.holding || !pending) return;
    this.#clearHoldTimer();

    const chunks = this.#holdChunks;
    this.#holdChunks = [];
    if (totalSamples(chunks) < MIC_RATE * MIN_HOLD_SECONDS) {
      this.#set({ holding: false, notice: "Giữ nút lâu hơn một chút và đọc to, rõ rồi mới thả." });
      return;
    }

    this.#set({ holding: false, phase: "assessing" });
    const sessionId = this.#sessionId;
    if (!sessionId) return;

    let result: AttemptResult | null = null;
    let failure: api.TutorApiError | null = null;
    try {
      result = await api.uploadAttempt(sessionId, encodeWav(chunks), pending.target);
    } catch (err) {
      failure = api.toTutorError(err);
    }
    if (this.#finishing) return;

    // Phiên đã bị server đóng (hết giờ phía backend...) thì kết thúc luôn; đổi từ trong lúc chấm cũng là 409 nhưng phiên vẫn mở
    if (failure?.code === "TUTOR_SESSION_CONFLICT") {
      const over = await api.getSession(sessionId).then((s) => s.outcome, () => null);
      if (over && !this.#finishing) {
        void this.#finish(over);
        return;
      }
    }
    if (this.#finishing) return;

    this.#pending = null;
    this.#learnerActivity();
    if (result) {
      // Backend đã tự chuyển sang từ kế tiếp khi cần; lấy từ đó làm Từ đang luyện
      this.#set({
        phase: "live",
        words: result.words,
        currentWord: result.nextWord ?? result.word ?? this.#state.currentWord,
        scoringTarget: null,
        scoringWord: null,
      });
      if (result.outcome) this.#markServerEnded(result.outcome);
      this.#answerScoring(pending, {
        score: Math.round(result.score),
        passed: result.passed,
        next_step: result.nextStep,
        next_word: result.nextWord ?? null,
        instruction: result.instruction,
      });
    } else if (failure) {
      this.#set({ phase: "live", scoringTarget: null, scoringWord: null, notice: failure.message });
      this.#answerScoring(pending, {
        error: failure.message,
        instruction:
          failure.instruction ??
          "Hệ thống gặp sự cố khi chấm. Xin lỗi người học ngắn gọn rồi hỏi họ muốn thử lại hay dừng.",
      });
    }
  }

  // --- tin nhắn từ Gemini Live ---

  #onMessage(message: LiveServerMessage) {
    if (this.#finishing) return;
    const content = message.serverContent;
    if (content) {
      if (content.interrupted) {
        this.#player?.flush();
        this.#flushTurn();
      }
      for (const part of content.modelTurn?.parts ?? []) {
        if (part.inlineData?.data) {
          this.#onTutorOutput();
          this.#player?.enqueue(part.inlineData.data);
        }
      }
      if (content.inputTranscription?.text) {
        this.#learnerActivity();
        this.#pushTranscript("learner", content.inputTranscription.text);
      }
      if (content.outputTranscription?.text) {
        this.#onTutorOutput();
        this.#pushTranscript("tutor", content.outputTranscription.text);
      }
      if (content.turnComplete) {
        this.#flushTurn();
        if (this.#serverEnded && this.#serverEndedReplySeen) {
          void this.#finish(this.#serverEnded, { drain: true });
        } else if (this.#wrapUpSent && this.#wrapUpReplySeen) {
          void this.#finish("timeout", { drain: true });
        } else {
          this.#armNudge();
        }
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
    if (this.#serverEnded) this.#serverEndedReplySeen = true;
    if (this.#started) return;
    this.#started = true;
    if (this.#startTimer) clearTimeout(this.#startTimer);
    this.#startTimer = null;
    this.#lastTick = performance.now();
    this.#ticker = setInterval(() => this.#onTick(), 250);
    if (this.#sessionId) {
      api.markStarted(this.#sessionId).catch((err) => this.#startRejected(err));
    }
  }

  /** Server từ chối `started` (hết lượt giữa chừng ở tab khác, hoặc phiên đã bị đóng): server đã đóng phiên nên chỉ dừng. */
  #startRejected(err: unknown) {
    const e = api.toTutorError(err);
    if (this.#finishing || e.status === 0) {
      console.warn("markStarted failed", e);
      return;
    }
    this.#finishing = true;
    this.#teardown();
    this.#set({
      phase: "fallback",
      outcome: "connect_failed",
      fallbackReason: e.message,
      fallbackCode: e.code,
      fallbackWords: this.#fallbackWords(),
    });
  }

  #fallbackWords(): PracticeWord[] {
    return this.#state.words.map((w) => ({ word: w.word, phoneme: w.phoneme, score: w.baseline, tipVi: w.tipVi ?? null }));
  }

  async #onClose() {
    if (this.#finishing) return;
    if (!this.#started) {
      await this.#connectFailed("Kết nối với gia sư bị đóng.");
    } else {
      await this.#finish("learner_exit");
    }
  }

  // --- tool call của gia sư ---

  async #handleToolCall(call: FunctionCall) {
    if (this.#finishing || !call.name) return;
    const id = call.id ?? null;
    const args = (call.args ?? {}) as Record<string, unknown>;

    switch (call.name) {
      case "log_turn": {
        const topic = parseTopic(args.topic);
        let response: Record<string, unknown> = { ok: true };
        let endedBy: SessionOutcome | null = null;
        if (this.#sessionId) {
          try {
            const result = await api.postTopic(this.#sessionId, topic);
            this.#set({ offTopicStreak: result.offTopicStreak ?? 0 });
            response = { off_topic_streak: result.offTopicStreak ?? 0, instruction: result.instruction ?? "" };
            if (result.ended) endedBy = result.outcome ?? "off_topic";
          } catch (err) {
            console.warn("postTopic failed", err);
          }
        }
        this.#respond(id, call.name, response);
        // Lạc đề đủ lần liên tiếp: backend đã kết thúc phiên; để gia sư chào xong rồi đóng
        if (endedBy) this.#markServerEnded(endedBy);
        break;
      }
      case "switch_word": {
        const word = typeof args.word === "string" ? args.word : "";
        const sessionId = this.#sessionId;
        if (!sessionId) break;
        try {
          const result = await api.switchWord(sessionId, word);
          this.#set({ words: result.words, currentWord: result.currentWord.word, notice: null });
          this.#respond(id, call.name, {
            ok: true,
            current_word: result.currentWord.word,
            attempts_left: result.attemptsLeft,
            instruction: result.instruction,
          });
        } catch (err) {
          const apiErr = api.toTutorError(err);
          this.#respond(id, call.name, { error: apiErr.message, instruction: apiErr.instruction ?? apiErr.message });
        }
        break;
      }
      case "request_retry": {
        const target = parseTarget(args.target);
        const { words, currentWord, limits } = this.#state;
        const current = words.find((w) => w.word === currentWord);
        if (this.#pending) {
          this.#respond(id, call.name, { error: "Đang có một lượt chấm chờ người học đọc." });
        } else if (target === "word" && !current) {
          this.#respond(id, call.name, {
            error: "Chưa có từ đang luyện.",
            instruction: "Hãy gọi switch_word(word=...) để chọn một từ trong câu trước.",
          });
        } else if (target === "word" && current && limits && current.attempts >= limits.maxAttemptsPerWord) {
          this.#respond(id, call.name, {
            error: `Từ "${current.word}" đã hết lượt chấm.`,
            instruction:
              "Hỏi người học muốn sang từ khác hay luyện lại từ này; cả hai đều gọi switch_word (với chính từ đó nếu luyện lại).",
          });
        } else {
          this.#beginScoring({ callId: id, name: call.name, target, word: target === "word" ? current!.word : null });
        }
        break;
      }
      case "end_session": {
        this.#respond(id, call.name, { ok: true });
        await this.#finish(parseOutcome(args.reason), { drain: true });
        break;
      }
      default:
        this.#respond(id, call.name, { error: `Không có tool ${call.name}.` });
    }
  }

  /**
   * Backend đã kết thúc phiên (đọc cả câu xong, hoặc lạc đề đủ lần). Đóng giao diện sau lượt chào của gia sư;
   * nếu gia sư im thì đóng sau SERVER_END_GRACE_MS để không treo.
   */
  #markServerEnded(outcome: SessionOutcome) {
    this.#serverEnded = outcome;
    this.#serverEndedReplySeen = false;
    if (this.#serverEndTimer) clearTimeout(this.#serverEndTimer);
    this.#serverEndTimer = setTimeout(() => void this.#finish(outcome, { drain: true }), SERVER_END_GRACE_MS);
  }

  #beginScoring(pending: PendingScoring) {
    this.#pending = pending;
    this.#holdChunks = [];
    this.#learnerActivity();
    this.#set({
      phase: "scoring",
      scoringTarget: pending.target,
      scoringWord: pending.word,
      holding: false,
      notice: null,
    });
  }

  /** Trả kết quả Lượt chấm cho gia sư: qua tool response, hoặc qua tin nhắn nếu người học tự mở. */
  #answerScoring(pending: PendingScoring, response: Record<string, unknown>) {
    if (pending.callId) {
      this.#respond(pending.callId, pending.name, response);
    } else {
      this.#live?.sendRealtimeInput({
        text: `[Hệ thống] Người học vừa tự mở lượt chấm. Kết quả: ${JSON.stringify(response)}`,
      });
    }
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
    if (this.#state.holding) this.#holdChunks.push(pcm);
    // Gia sư chỉ nghe khi đang trò chuyện; không nghe lúc người học giữ nút đọc hay chờ chấm
    if (this.#state.phase === "live" && this.#live && !this.#finishing) {
      try {
        this.#live.sendRealtimeInput({ audio: { data: int16ToBase64(pcm), mimeType: `audio/pcm;rate=${MIC_RATE}` } });
      } catch (err) {
        console.warn("sendRealtimeInput failed", err);
      }
    }
  }

  /**
   * Mỗi 250 ms: tính thời gian đã học (không đếm giờ chờ Azure), chốt ở trần, nhắc chốt lại trước trần, và xử lý
   * im lặng: không ai nói quá IDLE_ASK thì gia sư hỏi, quá IDLE_END thì kết thúc.
   */
  #onTick() {
    const limits = this.#state.limits;
    if (!limits || this.#finishing) return;
    const now = performance.now();
    const dt = now - this.#lastTick;
    this.#lastTick = now;
    const { phase, holding, tutorSpeaking } = this.#state;

    const next = tick({
      activeMs: this.#activeMs,
      idleMs: this.#idleMs,
      idleAsked: this.#idleAsked,
      wrapUpSent: this.#wrapUpSent,
      dtMs: dt,
      phase,
      holding,
      tutorSpeaking,
      limits,
    });
    this.#activeMs = next.activeMs;
    this.#idleMs = next.idleMs;
    this.#idleAsked = next.idleAsked;
    this.#set({ elapsedSeconds: next.seconds });

    for (const action of next.actions) {
      if (action === "timeout") void this.#finish("timeout");
      else if (action === "wrapUp") this.#sendWrapUp();
      else if (action === "idleAsk") this.#live?.sendRealtimeInput({ text: IDLE_ASK_TEXT });
      else void this.#finish("idle");
    }
  }

  #sendWrapUp() {
    if (this.#wrapUpSent || this.#state.phase !== "live") return;
    this.#wrapUpSent = true;
    this.#live?.sendRealtimeInput({ text: WRAP_UP_TEXT });
  }

  /** Người học vừa làm gì đó (nói, bấm, đọc): xoá bộ đếm im lặng. */
  #learnerActivity() {
    this.#idleMs = 0;
    this.#idleAsked = false;
  }

  /** Gia sư nói xong lượt mà im lặng: sau NUDGE_AFTER_MS thì nhắc gọi tool (tối đa MAX_NUDGES lần/phiên). */
  #armNudge() {
    this.#clearNudge();
    if (this.#nudges >= MAX_NUDGES || this.#wrapUpSent || this.#state.phase !== "live") return;
    this.#nudgeTimer = setTimeout(() => {
      this.#nudgeTimer = null;
      if (this.#state.phase !== "live" || this.#finishing || this.#state.tutorSpeaking || !this.#live) return;
      this.#nudges++;
      this.#live.sendRealtimeInput({ text: NUDGE_TEXT });
    }, NUDGE_AFTER_MS);
  }

  #clearNudge() {
    if (this.#nudgeTimer) clearTimeout(this.#nudgeTimer);
    this.#nudgeTimer = null;
  }

  // --- transcript ---

  #pushTranscript(role: "tutor" | "learner", text: string) {
    const open = this.#openTurn;
    if (open && open.role === role) {
      const turns = this.#state.turns.map((t) => (t.id === open.id ? { ...t, text: t.text + text } : t));
      this.#set({ turns });
      return;
    }
    this.#flushTurn();
    const id = ++this.#turnSeq;
    this.#openTurn = { id, role };
    this.#set({ turns: [...this.#state.turns, { id, role, text }] });
  }

  /** Chốt lượt đang mở. Hội thoại chỉ giữ trên màn hình, không gửi lên server (BR-TUTOR-09). */
  #flushTurn() {
    this.#openTurn = null;
  }

  // --- kết thúc ---

  async #connectFailed(reason: string) {
    if (this.#started || this.#finishing) return;
    this.#finishing = true;
    const sessionId = this.#sessionId;
    const fallbackWords = this.#fallbackWords();
    this.#teardown();
    if (sessionId) {
      await api.endSession(sessionId, "connect_failed").catch((err) => console.warn("endSession failed", err));
    }
    // Giữ các từ lỗi để hiện Mẹo sửa dạng chữ, không hiện lỗi trắng
    this.#set({
      phase: "fallback",
      outcome: "connect_failed",
      fallbackReason: reason,
      fallbackWords,
    });
  }

  async #finish(outcome: SessionOutcome, options: { drain?: boolean } = {}) {
    if (this.#finishing) return;
    this.#finishing = true;
    this.#stopTimers();
    this.#flushTurn();
    this.#pending = null;
    this.#set({ phase: "ended", holding: false, scoringTarget: null, scoringWord: null, outcome });

    let finalOutcome = outcome;
    if (this.#sessionId) {
      try {
        finalOutcome = await api.endSession(this.#sessionId, outcome);
      } catch (err) {
        console.warn("endSession failed", err);
      }
    }
    this.#set({ outcome: finalOutcome });

    if (options.drain) await this.#player?.whenIdle(DRAIN_MAX_MS);
    this.#teardown();
  }

  #stopTimers() {
    if (this.#startTimer) clearTimeout(this.#startTimer);
    if (this.#ticker) clearInterval(this.#ticker);
    this.#startTimer = null;
    this.#ticker = null;
    this.#clearHoldTimer();
    this.#clearNudge();
    if (this.#serverEndTimer) clearTimeout(this.#serverEndTimer);
    this.#serverEndTimer = null;
  }

  #clearHoldTimer() {
    if (this.#holdTimer) clearTimeout(this.#holdTimer);
    this.#holdTimer = null;
  }

  #teardown() {
    this.#stopTimers();
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

  #resetRuntime() {
    this.#sessionId = null;
    this.#started = false;
    this.#finishing = false;
    this.#serverEnded = null;
    this.#serverEndedReplySeen = false;
    this.#activeMs = 0;
    this.#idleMs = 0;
    this.#idleAsked = false;
    this.#wrapUpSent = false;
    this.#wrapUpReplySeen = false;
    this.#nudges = 0;
    this.#pending = null;
    this.#holdChunks = [];
    this.#openTurn = null;
    this.#toolQueue = Promise.resolve();
  }

  #set(patch: Partial<TutorState>) {
    const next = { ...this.#state, ...patch };
    const changed = (Object.keys(patch) as Array<keyof TutorState>).some((key) => next[key] !== this.#state[key]);
    if (!changed) return;
    this.#state = next;
    this.#listeners.forEach((listener) => listener());
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

