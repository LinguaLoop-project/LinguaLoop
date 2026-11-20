/** Phần tối thiểu của YouTube IFrame API mà trang dùng (không có @types chính thức). */
export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  /** Gỡ một mô-đun của trình phát (vd "captions" để tắt phụ đề có sẵn của YouTube). */
  unloadModule?(name: string): void;
  /** Đổi tùy chọn của một mô-đun (vd `setOption("captions", "track", {})` để bỏ phụ đề có sẵn). */
  setOption?(module: string, option: string, value: unknown): void;
  destroy(): void;
}

export interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onError: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Trạng thái trình phát YouTube. */
export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 } as const;

/** Chờ tối đa bấy nhiêu mili giây để API sẵn sàng. */
const LOAD_TIMEOUT_MS = 9000;

let youTubeApi: Promise<YouTubeNamespace> | null = null;

/** Nạp script IFrame API một lần cho cả ứng dụng; quá `LOAD_TIMEOUT_MS` mà chưa sẵn sàng thì báo lỗi. */
export function loadYouTubeApi(): Promise<YouTubeNamespace> {
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

const VIDEO_ID = /^[\w-]{11}$/;

/**
 * Lấy id video từ link YouTube (watch?v=, youtu.be/, shorts/, live/, embed/). Không nhận ra thì trả null; server vẫn
 * kiểm tra lại link khi tạo bài.
 */
export function parseYouTubeId(link: string): string | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(link.trim()) ? link.trim() : `https://${link.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [first, second] = url.pathname.split("/").filter(Boolean);
    id = first === "watch" ? url.searchParams.get("v") : ["shorts", "live", "embed"].includes(first ?? "") ? (second ?? null) : null;
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

/** Ảnh đại diện cỡ vừa (320x180) của video. */
export const youTubeThumbnail = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
