/**
 * Ghi âm mic thành PCM 16 kHz mono rồi đóng gói WAV 16-bit, định dạng Azure Speech và backend
 * (`WavAudio`) đọc trực tiếp, không cần giải mã lại như MediaRecorder. Chuyển từ azure-pronunciation-demo.
 * Cần `public/pcm-capture-worklet.js`.
 */

export const MIC_RATE = 16000;

export function totalSamples(chunks: Int16Array[]): number {
  return chunks.reduce((n, c) => n + c.length, 0);
}

/** WAV PCM 16-bit mono. */
export function encodeWav(chunks: Int16Array[], sampleRate: number = MIC_RATE): Blob {
  const samples = totalSamples(chunks);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples * 2, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++, offset += 2) view.setInt16(offset, chunk[i], true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** Mức âm lượng 0..1 của một khối PCM, để vẽ sóng. Giọng nói thường có RMS 0.02–0.3 nên kéo lên ×4. */
export function int16Level(pcm: Int16Array): number {
  let sum = 0;
  for (let i = 0; i < pcm.length; i++) {
    const v = pcm[i] / 32768;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / Math.max(1, pcm.length)) * 4);
}

export class MicCapture {
  #stream: MediaStream;
  #context: AudioContext;
  #node: AudioWorkletNode;

  private constructor(stream: MediaStream, context: AudioContext, node: AudioWorkletNode) {
    this.#stream = stream;
    this.#context = context;
    this.#node = node;
  }

  /** Hỏi quyền mic và bắt đầu thu. Gọi từ một thao tác của người dùng (click). */
  static async create(onChunk: (pcm: Int16Array) => void): Promise<MicCapture> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    try {
      const context = new AudioContext();
      await context.audioWorklet.addModule("/pcm-capture-worklet.js");
      if (context.state === "suspended") await context.resume();

      const node = new AudioWorkletNode(context, "pcm-capture");
      node.port.onmessage = (event: MessageEvent<Int16Array>) => onChunk(event.data);

      // Chrome chỉ chạy node khi nó nối tới đích; gain 0 để không nghe lại giọng mình
      const mute = context.createGain();
      mute.gain.value = 0;
      context.createMediaStreamSource(stream).connect(node);
      node.connect(mute).connect(context.destination);

      return new MicCapture(stream, context, node);
    } catch (err) {
      stream.getTracks().forEach((track) => track.stop());
      throw err;
    }
  }

  stop() {
    this.#node.port.onmessage = null;
    this.#node.disconnect();
    this.#stream.getTracks().forEach((track) => track.stop());
    void this.#context.close();
  }
}
