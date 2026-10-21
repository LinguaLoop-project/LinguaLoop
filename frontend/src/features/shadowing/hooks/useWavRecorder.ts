import { useCallback, useEffect, useRef, useState } from "react";
import { MIC_RATE, MicCapture, encodeWav, int16Level, totalSamples } from "@/lib/pcmRecorder";

/** Khớp BR-SHADOW-03: bản ghi ngắn hơn 0,5 giây bị server từ chối. */
const MIN_SECONDS = 0.5;
const WAVE_BARS = 48;

/** Ghi âm mic thành WAV PCM 16 kHz mono, định dạng Azure và backend đọc trực tiếp. */
export function useWavRecorder() {
  const [recording, setRecording] = useState(false);
  const [levels, setLevels] = useState<number[]>([]);
  const micRef = useRef<MicCapture | null>(null);
  const chunksRef = useRef<Int16Array[]>([]);

  useEffect(
    () => () => {
      micRef.current?.stop();
      micRef.current = null;
    },
    [],
  );

  /** Ném lỗi nếu không có quyền mic (`NotAllowedError`) hoặc không có thiết bị. */
  const start = useCallback(async () => {
    chunksRef.current = [];
    setLevels([]);
    micRef.current = await MicCapture.create((pcm) => {
      chunksRef.current.push(pcm);
      setLevels((prev) => [...prev.slice(-(WAVE_BARS - 1)), int16Level(pcm)]);
    });
    setRecording(true);
  }, []);

  /** @returns WAV, hoặc null nếu bản ghi quá ngắn */
  const stop = useCallback((): Blob | null => {
    micRef.current?.stop();
    micRef.current = null;
    setRecording(false);
    const chunks = chunksRef.current;
    chunksRef.current = [];
    return totalSamples(chunks) < MIC_RATE * MIN_SECONDS ? null : encodeWav(chunks);
  }, []);

  /** Bỏ bản ghi đang dở (chuyển câu giữa chừng). */
  const cancel = useCallback(() => {
    micRef.current?.stop();
    micRef.current = null;
    chunksRef.current = [];
    setRecording(false);
  }, []);

  return { recording, levels, start, stop, cancel };
}
