import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/** Phần tối thiểu của YouTube IFrame API mà trang dùng (không có @types chính thức). */
interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, string | number>;
      events: { onReady: () => void; onError: () => void };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_STATE_PLAYING = 1;
const YT_STATE_BUFFERING = 3;
const TICK_MS = 90;
/** Chờ tối đa bấy nhiêu mili giây để API/video sẵn sàng; quá hạn coi là không tải được. */
const LOAD_TIMEOUT_MS = 9000;
/** Bấm phát mà sau bấy nhiêu mili giây vẫn chưa phát thì coi là bị trình duyệt chặn tiếng. */
const START_TIMEOUT_MS = 2000;
/** Dừng sớm một chút trước mốc kết thúc để không lọt sang câu sau. */
const END_MARGIN_MS = 50;

let youTubeApi: Promise<YouTubeNamespace> | null = null;

/** Nạp script IFrame API một lần cho cả ứng dụng. */
function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!youTubeApi) {
    youTubeApi = new Promise<YouTubeNamespace>((resolve, reject) => {
      const fail = () => {
        youTubeApi = null;
        reject(new Error("YouTube IFrame API failed to load"));
      };
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT?.Player) resolve(window.YT);
        else fail();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = fail;
      document.head.appendChild(script);
      window.setTimeout(() => {
        if (!window.YT?.Player) fail();
      }, LOAD_TIMEOUT_MS);
    });
  }
  return youTubeApi;
}

export type PlayerStatus = "loading" | "ready" | "failed" | "blocked" | "nosource";

export interface UsePlayerOptions {
  videoId: string | null;
  /** Nguồn audio/video trực tiếp; chỉ dùng khi không có `videoId`. */
  mediaUrl: string | null;
  /** Phần tử chứa video YouTube (chỉ dùng cho YouTube). */
  containerRef: RefObject<HTMLDivElement | null>;
  rate: number;
}

export interface PlayerApi {
  status: PlayerStatus;
  kind: "youtube" | "media" | "none";
  playing: boolean;
  currentMs: number;
  durationMs: number;
  /** Phát từ `startMs` tới `endMs` rồi tự dừng. */
  playSentence: (startMs: number, endMs: number) => void;
  stop: () => void;
  /** Tải lại nguồn phát sau lỗi. */
  retry: () => void;
}

/**
 * Điều khiển một nguồn phát để nghe từng câu theo mốc thời gian. Hủy trình phát khi rời trang,
 * và báo `blocked` khi bấm phát mà không có tiếng (trình duyệt chặn).
 */
export function usePlayer({ videoId, mediaUrl, containerRef, rate }: UsePlayerOptions): PlayerApi {
  const kind: PlayerApi["kind"] = videoId ? "youtube" : mediaUrl ? "media" : "none";
  const [status, setStatus] = useState<PlayerStatus>(kind === "none" ? "nosource" : "loading");
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const youTubeRef = useRef<YouTubePlayer | null>(null);
  const mediaRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<number | undefined>(undefined);
  const statusRef = useRef<PlayerStatus>(status);
  const rateRef = useRef(rate);

  useEffect(() => {
    statusRef.current = status;
    rateRef.current = rate;
  });

  const stopTick = useCallback(() => {
    window.clearInterval(tickRef.current);
    tickRef.current = undefined;
  }, []);

  const stop = useCallback(() => {
    stopTick();
    try {
      youTubeRef.current?.pauseVideo();
      mediaRef.current?.pause();
    } catch {
      // trình phát đã bị hủy: bỏ qua
    }
    setPlaying(false);
  }, [stopTick]);

  // Tạo và hủy trình phát theo nguồn; `reloadKey` đổi thì dựng lại (nút Tải lại).
  useEffect(() => {
    if (kind === "none") return;
    let cancelled = false;
    let element: HTMLElement | null = null;

    const markReady = (duration: number) => {
      window.clearTimeout(loadTimer);
      if (cancelled) return;
      setDurationMs(Math.round(duration * 1000));
      setStatus("ready");
    };
    const markFailed = () => {
      window.clearTimeout(loadTimer);
      if (cancelled) return;
      setStatus("failed");
    };
    const loadTimer = window.setTimeout(markFailed, LOAD_TIMEOUT_MS);

    if (kind === "youtube" && videoId) {
      void loadYouTubeApi()
        .then((yt) => {
          const container = containerRef.current;
          if (cancelled || !container) return;
          element = document.createElement("div");
          container.appendChild(element);
          const player = new yt.Player(element, {
            videoId,
            playerVars: {
              controls: 0,
              disablekb: 1,
              rel: 0,
              playsinline: 1,
              modestbranding: 1,
              fs: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: () => markReady(player.getDuration()),
              onError: markFailed,
            },
          });
          youTubeRef.current = player;
        })
        .catch(markFailed);
    } else if (mediaUrl) {
      const media = new Audio();
      media.preload = "auto";
      media.addEventListener("loadedmetadata", () => markReady(media.duration));
      media.addEventListener("error", markFailed);
      media.src = mediaUrl;
      mediaRef.current = media;
    }

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      stopTick();
      try {
        youTubeRef.current?.destroy();
      } catch {
        // đã hủy hoặc chưa sẵn sàng
      }
      youTubeRef.current = null;
      mediaRef.current?.pause();
      mediaRef.current = null;
      element?.remove();
    };
  }, [kind, videoId, mediaUrl, containerRef, reloadKey, stopTick]);

  const playSentence = useCallback(
    (startMs: number, endMs: number) => {
      const state = statusRef.current;
      if (state !== "ready" && state !== "blocked") return;
      stopTick();
      setPlaying(true);
      setCurrentMs(startMs);
      const startedAt = performance.now();

      const finishBlocked = () => {
        stop();
        setStatus("blocked");
      };

      const youTube = youTubeRef.current;
      const media = mediaRef.current;
      if (youTube) {
        try {
          youTube.setPlaybackRate(rateRef.current);
          youTube.seekTo(startMs / 1000, true);
          youTube.playVideo();
        } catch {
          finishBlocked();
          return;
        }
        tickRef.current = window.setInterval(() => {
          let snapshot: { nowMs: number; state: number };
          try {
            snapshot = { nowMs: youTube.getCurrentTime() * 1000, state: youTube.getPlayerState() };
          } catch {
            finishBlocked();
            return;
          }
          const { nowMs, state: playerState } = snapshot;
          setCurrentMs(nowMs);
          if (playerState === YT_STATE_PLAYING && statusRef.current === "blocked") setStatus("ready");
          if (nowMs >= endMs - END_MARGIN_MS && nowMs >= startMs) {
            stop();
            return;
          }
          const notStarted = playerState !== YT_STATE_PLAYING && playerState !== YT_STATE_BUFFERING;
          if (notStarted && performance.now() - startedAt > START_TIMEOUT_MS) finishBlocked();
        }, TICK_MS);
      } else if (media) {
        media.currentTime = startMs / 1000;
        media.playbackRate = rateRef.current;
        media.play().catch(finishBlocked);
        tickRef.current = window.setInterval(() => {
          const nowMs = media.currentTime * 1000;
          setCurrentMs(nowMs);
          if (statusRef.current === "blocked" && !media.paused) setStatus("ready");
          if (nowMs >= endMs - END_MARGIN_MS || media.ended) stop();
        }, TICK_MS);
      }
    },
    [stop, stopTick],
  );

  const retry = useCallback(() => {
    stop();
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }, [stop]);

  return { status, kind, playing, currentMs, durationMs, playSentence, stop, retry };
}
