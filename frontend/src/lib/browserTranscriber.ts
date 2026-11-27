/**
 * Chép lời giọng người học bằng Web Speech API của trình duyệt, khóa tiếng Anh.
 * Phần chép lời của Gemini Live tự đoán ngôn ngữ nên giọng Việt hay bị chép thành chữ Hàn, Nhật...; Gemini vẫn nghe đúng
 * (nó hiểu trực tiếp âm thanh), chỉ có chữ hiện lên màn hình là sai. Chỉ chạy ở Chrome/Edge; nơi khác thì `create` trả null
 * và controller giữ chữ của Gemini.
 */

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  0: RecognitionAlternative;
  length: number;
}
interface RecognitionEvent {
  results: { length: number; [index: number]: RecognitionResult };
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Lỗi mà thử lại cũng vô ích (không cho dùng mic, không có dịch vụ): bỏ chép lời bằng trình duyệt. */
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "language-not-supported", "audio-capture"]);

export interface BrowserTranscriberOptions {
  lang?: string;
  /** Văn bản của lượt nói hiện tại (từ lúc reset), gồm cả phần chưa chốt. */
  onText: (text: string) => void;
  /** Chỉ nhận chữ khi trả true (lúc gia sư đang nói, tắt micro... thì bỏ để khỏi chép nhầm tiếng loa). */
  isActive: () => boolean;
}

export class BrowserTranscriber {
  #recognition: RecognitionLike;
  #options: BrowserTranscriberOptions;
  #running = false;
  #failed = false;
  #offset = 0;
  #seen = 0;

  private constructor(recognition: RecognitionLike, options: BrowserTranscriberOptions) {
    this.#recognition = recognition;
    this.#options = options;
    recognition.lang = options.lang ?? "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => this.#onResult(event);
    recognition.onerror = (event) => {
      if (event.error && FATAL_ERRORS.has(event.error)) {
        this.#failed = true;
        this.#running = false;
      }
    };
    recognition.onend = () => {
      // Chrome tự đóng sau một lúc im lặng: mở lại khi vẫn đang chạy
      this.#offset = 0;
      this.#seen = 0;
      if (this.#running && !this.#failed) this.#startSafely();
    };
  }

  static supported(): boolean {
    return recognitionCtor() !== null;
  }

  static create(options: BrowserTranscriberOptions): BrowserTranscriber | null {
    const Ctor = recognitionCtor();
    if (!Ctor) return null;
    try {
      return new BrowserTranscriber(new Ctor(), options);
    } catch {
      return null;
    }
  }

  /** Còn dùng được: đã chạy và chưa gặp lỗi không thể thử lại. */
  get working(): boolean {
    return this.#running && !this.#failed;
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#startSafely();
  }

  stop() {
    this.#running = false;
    try {
      this.#recognition.abort();
    } catch {
      // đã dừng
    }
  }

  /** Lượt nói mới: bỏ phần đã chép, lần sau chỉ lấy chữ đến từ bây giờ. */
  reset() {
    this.#offset = this.#seen;
  }

  #startSafely() {
    try {
      this.#recognition.start();
    } catch {
      // start() khi đang chạy sẽ ném lỗi; bỏ qua
    }
  }

  #onResult(event: RecognitionEvent) {
    this.#seen = event.results.length;
    if (!this.#options.isActive()) {
      this.#offset = this.#seen;
      return;
    }
    let text = "";
    for (let i = this.#offset; i < event.results.length; i++) text += event.results[i][0].transcript;
    text = text.trim();
    if (text) this.#options.onText(text);
  }
}
