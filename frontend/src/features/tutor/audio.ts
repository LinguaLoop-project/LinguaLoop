/**
 * Phần âm thanh riêng của Phiên gia sư: mã hoá base64 cho Gemini Live và phát PCM 24 kHz của gia sư. Thu mic và đóng
 * gói WAV dùng chung với Shadowing ở `@/lib/pcmRecorder`.
 */

export const TUTOR_RATE = 24000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

export function int16ToBase64(pcm: Int16Array): string {
  return bytesToBase64(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
}

export function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
}

function rms(samples: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, samples.length));
}

/** Giọng nói thường có RMS 0.02–0.3; kéo lên thang 0..1 cho dễ nhìn. */
function rmsToLevel(value: number): number {
  return Math.min(1, value * 4);
}

/** Phát PCM 16-bit 24 kHz của gia sư theo hàng đợi, ngắt được khi người học nói chen. */
export class PcmPlayer {
  #context: AudioContext;
  #nextStart = 0;
  #active = new Set<AudioBufferSourceNode>();
  #waiters: Array<() => void> = [];
  #speaking = false;
  #onSpeakingChange: (speaking: boolean) => void;
  #analyser: AnalyserNode;
  #samples: Float32Array<ArrayBuffer>;

  constructor(onSpeakingChange: (speaking: boolean) => void) {
    this.#context = new AudioContext({ sampleRate: TUTOR_RATE });
    this.#analyser = this.#context.createAnalyser();
    this.#analyser.fftSize = 512;
    this.#analyser.connect(this.#context.destination);
    this.#samples = new Float32Array(this.#analyser.fftSize);
    this.#onSpeakingChange = onSpeakingChange;
  }

  /** Mức âm lượng gia sư đang phát, 0..1 (để vẽ hiệu ứng). */
  level(): number {
    this.#analyser.getFloatTimeDomainData(this.#samples);
    return rmsToLevel(rms(this.#samples));
  }

  async resume() {
    if (this.#context.state === "suspended") await this.#context.resume();
  }

  enqueue(base64Pcm: string) {
    const pcm = base64ToInt16(base64Pcm);
    if (pcm.length === 0) return;

    const buffer = this.#context.createBuffer(1, pcm.length, TUTOR_RATE);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;

    const source = this.#context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.#analyser);
    source.onended = () => {
      this.#active.delete(source);
      if (this.#active.size === 0) this.#setSpeaking(false);
    };

    // Một chút đệm ở chunk đầu để không bị giật
    const startAt = Math.max(this.#context.currentTime + 0.03, this.#nextStart);
    source.start(startAt);
    this.#nextStart = startAt + buffer.duration;
    this.#active.add(source);
    this.#setSpeaking(true);
  }

  /** Dừng ngay mọi âm thanh đang chờ phát (người học nói chen hoặc kết thúc phiên). */
  flush() {
    for (const source of [...this.#active]) {
      try {
        source.stop();
      } catch {
        // đã dừng
      }
    }
    this.#nextStart = 0;
  }

  /** Chờ phát hết hàng đợi, tối đa maxMs. */
  whenIdle(maxMs: number): Promise<void> {
    if (this.#active.size === 0) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(done, maxMs);
      function done() {
        clearTimeout(timer);
        resolve();
      }
      this.#waiters.push(done);
    });
  }

  close() {
    this.flush();
    this.#setSpeaking(false);
    void this.#context.close();
  }

  #setSpeaking(speaking: boolean) {
    if (this.#speaking !== speaking) {
      this.#speaking = speaking;
      this.#onSpeakingChange(speaking);
    }
    if (!speaking) {
      const waiters = this.#waiters;
      this.#waiters = [];
      waiters.forEach((resolve) => resolve());
    }
  }
}
