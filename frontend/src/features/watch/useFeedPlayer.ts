import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { loadYouTubeApi, YT_STATE, type YouTubePlayer } from "@/lib/youtube";

/** Chu kỳ đọc vị trí video để tô sáng câu và từ. */
const TICK_MS = 100;
/** Chờ video sẵn sàng tối đa bấy nhiêu mili giây; quá hạn coi là lỗi nguồn phát (AC-TC-33). */
const LOAD_TIMEOUT_MS = 12_000;
/** Sau bấy nhiêu mili giây mà video chưa phát thì coi là trình duyệt chặn tự phát có tiếng. */
const AUTOPLAY_CHECK_MS = 1500;

export type FeedPlayerStatus = "idle" | "loading" | "ready" | "failed";

export interface UseFeedPlayerOptions {
  videoId: string;
  /** Chỉ video đang hiển thị mới dựng trình phát; rời đi thì hủy để chỉ có một video phát (BR-TC-14). */
  active: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  rate: number;
  muted: boolean;
  /** Trình duyệt chặn tự phát có tiếng: video đã được tắt tiếng để phát tiếp. */
  onAutoplayBlocked: () => void;
}

export interface FeedPlayer {
  status: FeedPlayerStatus;
  playing: boolean;
  currentMs: number;
  play: () => void;
  pause: () => void;
  retry: () => void;
}

/** Trình phát YouTube của một video trong luồng: tự phát khi hiện, tự lặp khi hết, đọc vị trí liên tục. */
export function useFeedPlayer({
  videoId,
  active,
  containerRef,
  rate,
  muted,
  onAutoplayBlocked,
}: UseFeedPlayerOptions): FeedPlayer {
  const [status, setStatus] = useState<FeedPlayerStatus>("idle");
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const settingsRef = useRef({ rate, muted, onAutoplayBlocked });

  useEffect(() => {
    settingsRef.current = { rate, muted, onAutoplayBlocked };
  });

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let tick: number | undefined;
    let autoplayTimer: number | undefined;
    const element = document.createElement("div");
    element.className = "h-full w-full";
    container.replaceChildren(element);
    setStatus("loading");
    setPlaying(false);
    setCurrentMs(0);

    const fail = () => {
      if (cancelled) return;
      setStatus("failed");
      setPlaying(false);
    };
    const loadTimer = window.setTimeout(fail, LOAD_TIMEOUT_MS);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        const player = new YT.Player(element, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            cc_load_policy: 0,
            mute: settingsRef.current.muted ? 1 : 0,
          },
          events: {
            onReady: () => {
              window.clearTimeout(loadTimer);
              if (cancelled) return;
              playerRef.current = player;
              player.setPlaybackRate(settingsRef.current.rate);
              // Phụ đề có sẵn của YouTube sẽ đè lên phụ đề của LinguaLoop (có từ bấm tra được): tắt nó.
              try {
                player.setOption?.("captions", "track", {});
                player.unloadModule?.("captions");
              } catch {
                // trình phát không hỗ trợ: bỏ qua
              }
              if (settingsRef.current.muted) player.mute();
              else player.unMute();
              player.playVideo();
              setStatus("ready");
              tick = window.setInterval(() => {
                try {
                  setCurrentMs(Math.round(player.getCurrentTime() * 1000));
                } catch {
                  // trình phát vừa bị hủy
                }
              }, TICK_MS);
              autoplayTimer = window.setTimeout(() => {
                if (cancelled || settingsRef.current.muted) return;
                if (player.getPlayerState() !== YT_STATE.PLAYING) {
                  player.mute();
                  player.playVideo();
                  settingsRef.current.onAutoplayBlocked();
                }
              }, AUTOPLAY_CHECK_MS);
            },
            onError: () => {
              window.clearTimeout(loadTimer);
              fail();
            },
            onStateChange: ({ data }) => {
              if (cancelled) return;
              if (data === YT_STATE.ENDED) {
                player.seekTo(0, true);
                player.playVideo();
              } else if (data === YT_STATE.PLAYING) {
                setPlaying(true);
              } else if (data === YT_STATE.PAUSED) {
                setPlaying(false);
              }
            },
          },
        });
      })
      .catch(() => {
        window.clearTimeout(loadTimer);
        fail();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
      window.clearTimeout(autoplayTimer);
      window.clearInterval(tick);
      try {
        playerRef.current?.destroy();
      } catch {
        // đã hủy
      }
      playerRef.current = null;
      container.replaceChildren();
      setStatus("idle");
      setPlaying(false);
    };
  }, [active, videoId, containerRef, reloadKey]);

  useEffect(() => {
    playerRef.current?.setPlaybackRate(rate);
  }, [rate, status]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) player.mute();
    else player.unMute();
  }, [muted, status]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  return { status, playing, currentMs, play, pause, retry };
}
