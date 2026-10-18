import { useCallback, useEffect, useRef, useState } from "react";

interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, string | number>;
      events: { onReady: () => void; onError: () => void };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface ModelSegment {
  startMs: number;
  endMs: number;
  text: string;
}

const API_TIMEOUT_MS = 9000;

/** Đọc chữ của câu bằng giọng tổng hợp của trình duyệt (phương án cuối khi không có video hay tệp âm thanh). */
function speakSegment(text: string, rate: number, finish: () => void) {
  if (!("speechSynthesis" in window)) {
    finish();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = Math.min(1.1, rate + 0.15);
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * Phát câu mẫu: cắt đoạn [startMs, endMs] của video YouTube, hoặc của tệp âm thanh (`mediaUrl`) nếu có;
 * nếu không có hoặc bị lỗi thì đọc chữ của câu bằng giọng tổng hợp của trình duyệt.
 * Gắn `hostRef` vào một thẻ div để hiện video.
 */
export function useModelPlayer({
  videoId,
  mediaUrl,
  rate,
}: {
  videoId: string | null;
  mediaUrl: string | null;
  rate: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mediaFailed, setMediaFailed] = useState(false);
  const timerRef = useRef<number>(0);
  const runRef = useRef(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  /** Vị trí phát hiện tại (mili giây) khi đang phát, null khi dừng. */
  const [positionMs, setPositionMs] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!videoId || !host) return;
    let cancelled = false;
    const mount = document.createElement("div");
    host.replaceChildren(mount);

    const make = () => {
      if (cancelled || !window.YT) return;
      try {
        playerRef.current = new window.YT.Player(mount, {
          videoId,
          playerVars: { controls: 0, disablekb: 1, rel: 0, playsinline: 1, modestbranding: 1, fs: 0, origin: location.origin },
          events: {
            onReady: () => {
              if (!cancelled) setVideoReady(true);
            },
            onError: () => {
              if (!cancelled) setVideoFailed(true);
            },
          },
        });
      } catch {
        setVideoFailed(true);
      }
    };

    let timeout = 0;
    if (window.YT?.Player) {
      make();
    } else {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        make();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.onerror = () => {
          if (!cancelled) setVideoFailed(true);
        };
        document.head.appendChild(script);
      }
      timeout = window.setTimeout(() => {
        if (!cancelled && !playerRef.current) setVideoFailed(true);
      }, API_TIMEOUT_MS);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      try {
        playerRef.current?.destroy();
      } catch {
        // player có thể đã bị huỷ
      }
      playerRef.current = null;
    };
  }, [videoId, attempt]);

  // Tệp âm thanh của bài: nạp sẵn để bấm "Nghe mẫu" là phát ngay
  useEffect(() => {
    if (!mediaUrl) return;
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = mediaUrl;
    audio.onerror = () => setMediaFailed(true);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
    };
  }, [mediaUrl]);

  const stop = useCallback(() => {
    runRef.current += 1;
    window.clearInterval(timerRef.current);
    try {
      playerRef.current?.pauseVideo();
    } catch {
      // bỏ qua
    }
    audioRef.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
    setPositionMs(null);
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    (segment: ModelSegment, onDone?: () => void) => {
      stop();
      const run = runRef.current;
      setPlaying(true);
      const finish = () => {
        if (runRef.current !== run) return; // đã bị dừng hoặc thay bằng lượt phát khác
        stop();
        onDone?.();
      };

      const player = playerRef.current;
      if (player && videoReady && !videoFailed) {
        try {
          player.setPlaybackRate(rate);
          player.seekTo(segment.startMs / 1000, true);
          player.playVideo();
          const startedAt = performance.now();
          const maxMs = (segment.endMs - segment.startMs) / rate + 4000;
          timerRef.current = window.setInterval(() => {
            let t = 0;
            try {
              t = player.getCurrentTime();
            } catch {
              // chờ lần sau
            }
            setPositionMs(Math.round(t * 1000));
            if (t >= segment.endMs / 1000 - 0.05 || performance.now() - startedAt > maxMs) finish();
          }, 100);
          return;
        } catch {
          setVideoFailed(true);
        }
      }

      const audio = audioRef.current;
      if (audio && !mediaFailed) {
        audio.playbackRate = rate;
        audio.currentTime = segment.startMs / 1000;
        audio
          .play()
          .then(() => {
            const startedAt = performance.now();
            const maxMs = (segment.endMs - segment.startMs) / rate + 4000;
            timerRef.current = window.setInterval(() => {
              setPositionMs(Math.round(audio.currentTime * 1000));
              if (audio.currentTime >= segment.endMs / 1000 - 0.05 || audio.ended || performance.now() - startedAt > maxMs) {
                audio.pause();
                finish();
              }
            }, 100);
          })
          .catch(() => {
            // Không phát được tệp (hết hạn, chặn tự phát…): lùi về giọng tổng hợp
            setMediaFailed(true);
            if (runRef.current === run) speakSegment(segment.text, rate, finish);
          });
        return;
      }
      speakSegment(segment.text, rate, finish);
    },
    [mediaFailed, rate, stop, videoFailed, videoReady],
  );

  /**
   * Tab Xem: phát liền mạch từ câu `from` tới hết bài, gọi `onIndex` mỗi khi sang câu mới để danh sách sáng
   * theo lời nói. Nguồn phát như {@link play}: video, tệp âm thanh, hoặc đọc lần lượt từng câu.
   */
  const watch = useCallback(
    (segments: ModelSegment[], from: number, onIndex: (index: number) => void, onDone?: () => void) => {
      stop();
      const run = runRef.current;
      setPlaying(true);
      const finish = () => {
        if (runRef.current !== run) return;
        stop();
        onDone?.();
      };
      const last = segments[segments.length - 1];
      let current = from;
      onIndex(from);
      const follow = (seconds: number) => {
        const k = segments.findIndex((s) => seconds >= s.startMs / 1000 && seconds < s.endMs / 1000);
        if (k >= 0 && k !== current) {
          current = k;
          onIndex(k);
        }
      };

      const speakFrom = (k: number) => {
        if (runRef.current !== run) return;
        if (k >= segments.length) {
          finish();
          return;
        }
        current = k;
        onIndex(k);
        speakSegment(segments[k].text, 1, () => speakFrom(k + 1));
      };

      const player = playerRef.current;
      if (player && videoReady && !videoFailed) {
        try {
          player.setPlaybackRate(1);
          player.seekTo(segments[from].startMs / 1000, true);
          player.playVideo();
          timerRef.current = window.setInterval(() => {
            let t = 0;
            try {
              t = player.getCurrentTime();
            } catch {
              // chờ lần sau
            }
            follow(t);
            setPositionMs(Math.round(t * 1000));
            if (t >= last.endMs / 1000) {
              try {
                player.pauseVideo();
              } catch {
                // bỏ qua
              }
              finish();
            }
          }, 120);
          return;
        } catch {
          setVideoFailed(true);
        }
      }

      const audio = audioRef.current;
      if (audio && !mediaFailed) {
        audio.playbackRate = 1;
        audio.currentTime = segments[from].startMs / 1000;
        audio
          .play()
          .then(() => {
            timerRef.current = window.setInterval(() => {
              follow(audio.currentTime);
              setPositionMs(Math.round(audio.currentTime * 1000));
              if (audio.currentTime >= last.endMs / 1000 || audio.ended) {
                audio.pause();
                finish();
              }
            }, 120);
          })
          .catch(() => {
            setMediaFailed(true);
            speakFrom(from);
          });
        return;
      }
      speakFrom(from);
    },
    [mediaFailed, stop, videoFailed, videoReady],
  );

  const retryVideo = useCallback(() => {
    setVideoFailed(false);
    setVideoReady(false);
    setAttempt((n) => n + 1);
  }, []);

  return {
    hostRef,
    playing,
    positionMs,
    play,
    watch,
    stop,
    showVideo: !!videoId && !videoFailed,
    videoFailed: !!videoId && videoFailed,
    retryVideo,
  };
}
