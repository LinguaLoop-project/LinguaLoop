// AudioWorklet: lấy mẫu mic, chuyển về PCM 16-bit mono 16 kHz (định dạng Gemini Live nhận và Azure chấm).
// Resample bằng nội suy tuyến tính nên không cần AudioContext ở đúng 16 kHz (Firefox không hỗ trợ).
const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 640; // 40 ms

class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_RATE;
    this.pos = 0; // vị trí mẫu kế tiếp, tính từ đầu khối hiện tại; có thể âm (nằm giữa khối trước và khối này)
    this.last = 0; // mẫu cuối của khối trước
    this.out = new Int16Array(CHUNK_SAMPLES);
    this.count = 0;
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input || input.length === 0) return true;

    let pos = this.pos;
    while (pos < input.length - 1) {
      const i = Math.floor(pos);
      const frac = pos - i;
      const a = i < 0 ? this.last : input[i];
      const b = input[i + 1];
      const sample = Math.max(-1, Math.min(1, a + (b - a) * frac));
      this.out[this.count++] = sample < 0 ? sample * 32768 : sample * 32767;
      if (this.count === CHUNK_SAMPLES) {
        const chunk = this.out;
        this.port.postMessage(chunk, [chunk.buffer]);
        this.out = new Int16Array(CHUNK_SAMPLES);
        this.count = 0;
      }
      pos += this.ratio;
    }
    this.pos = pos - input.length;
    this.last = input[input.length - 1];
    return true;
  }
}

registerProcessor("pcm-capture", PcmCapture);
