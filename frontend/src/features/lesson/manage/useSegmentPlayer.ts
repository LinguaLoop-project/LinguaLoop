import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { loadYouTubeApi, type YouTubePlayer } from "@/lib/youtube";

const TICK_MS = 100;
const LOAD_TIMEOUT_MS = 9000;
const END_MARGIN_MS = 50;

export type SegmentPlayerStatus = "loading" | "ready" | "failed";

export interface SegmentPlayer {
  status: SegmentPlayerStatus;
  /** Khóa của đoạn đang phát (thường là mã câu), `null` khi đang dừng. */
  playingKey: string | null;
  /** Vị trí phát (ms), cập nhật mỗi `TICK_MS` khi đang phát; `null` khi chưa phát lần nào. */
  positionMs: number | null;
  /** Phát từ `startMs` tới `endMs` rồi tự dừng (nghe thử đoạn của câu, UC-BH-02 4a, UC-BH-05 3a). */
  play: (key: string, startMs: number, endMs: number) => void;
  /** Phát từ `startMs` và chạy tiếp qua các câu sau, không tự dừng (chế độ "Phát liên tục"). */
  playThrough: (key: string, startMs: number) => void;
  stop: () => void;
  /** Thời điểm đang phát (ms) đọc trực tiếp từ trình phát, dùng cho nút "Lấy thời điểm đang phát". */
  currentMs: () => number | null;
}

/**
 * Trình phát YouTube để giáo viên và quản trị viên nghe thử từng câu. Không ghi nhận tiến độ học (BR-BH-15). Video bị
 * gỡ hoặc riêng tư thì báo `failed`, trang vẫn hiện đủ danh sách câu (UC-BH-02 3a).
 */
export function useSegmentPlayer(
  videoId: string | null,
  containerRef: RefObject<HTMLDivElement | null>,
  /** Gọi khi video bắt đầu hoặc ngừng phát, kể cả khi người dùng tự bấm trên khung video (không chỉ `play`). */
  onPlayingChange?: (playing: boolean) => void,
): SegmentPlayer {
  const [status, setStatus] = useState<SegmentPlayerStatus>("loading");
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [positionMs, setPositionMs] = useState<number | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const tickRef = useRef<number | undefined>(undefined);
  const playingChangeRef = useRef(onPlayingChange);
  useEffect(() => {
    playingChangeRef.current = onPlayingChange;
  });

  const stop = useCallback(() => {
    window.clearInterval(tickRef.current);
    tickRef.current = undefined;
    try {
      playerRef.current?.pauseVideo();
    } catch {
      // trình phát đã bị hủy
    }
    setPlayingKey(null);
  }, []);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    let element: HTMLElement | null = null;
    const loadTimer = window.setTimeout(() => !cancelled && setStatus("failed"), LOAD_TIMEOUT_MS);

    void loadYouTubeApi()
      .then((yt) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        element = document.createElement("div");
        container.appendChild(element);
        playerRef.current = new yt.Player(element, {
          videoId,
          playerVars: { controls: 1, rel: 0, playsinline: 1, modestbranding: 1, origin: window.location.origin },
          events: {
            onReady: () => {
              window.clearTimeout(loadTimer);
              if (!cancelled) setStatus("ready");
            },
            onError: () => {
              window.clearTimeout(loadTimer);
              if (!cancelled) setStatus("failed");
            },
            // 1 = đang phát, 3 = đang tải đệm; còn lại (dừng, hết video, chưa phát) là không có tiếng
            onStateChange: (event) => playingChangeRef.current?.(event.data === 1 || event.data === 3),
          },
        });
      })
      .catch(() => !cancelled && setStatus("failed"));

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      window.clearInterval(tickRef.current);
      try {
        playerRef.current?.destroy();
      } catch {
        // đã hủy
      }
      playerRef.current = null;
      element?.remove();
    };
  }, [videoId, containerRef]);

  /** Seek tới `startMs`, phát, rồi mỗi nhịp cập nhật vị trí; dừng khi tới `endMs` (nếu có). */
  const start = useCallback(
    (key: string, startMs: number, endMs: number | null) => {
      const player = playerRef.current;
      if (!player || status !== "ready") return;
      window.clearInterval(tickRef.current);
      try {
        player.seekTo(startMs / 1000, true);
        player.playVideo();
      } catch {
        return;
      }
      setPlayingKey(key);
      setPositionMs(startMs);
      tickRef.current = window.setInterval(() => {
        let now: number;
        try {
          now = player.getCurrentTime() * 1000;
        } catch {
          stop();
          return;
        }
        setPositionMs(now);
        if (endMs !== null && now >= endMs - END_MARGIN_MS) stop();
      }, TICK_MS);
    },
    [status, stop],
  );

  const play = useCallback((key: string, startMs: number, endMs: number) => start(key, startMs, endMs), [start]);
  const playThrough = useCallback((key: string, startMs: number) => start(key, startMs, null), [start]);

  const currentMs = useCallback(() => {
    try {
      const seconds = playerRef.current?.getCurrentTime();
      return seconds === undefined ? null : Math.round(seconds * 1000);
    } catch {
      return null;
    }
  }, []);

  return { status, playingKey, positionMs, play, playThrough, stop, currentMs };
}
