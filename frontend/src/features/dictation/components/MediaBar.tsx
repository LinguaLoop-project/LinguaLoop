import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { PlayerApi } from "../usePlayer";

export interface MediaBarProps {
  player: PlayerApi;
  /** Phần tử chứa video YouTube; luôn được vẽ để trình phát không bị hủy khi ẩn video. */
  videoRef: RefObject<HTMLDivElement | null>;
  hideVideo: boolean;
  onToggleVideo: () => void;
}

interface NoticeProps {
  icon: string;
  title: string;
  description: string;
  role: "status" | "alert";
  action?: { label: string; onClick: () => void };
}

const Notice = ({ icon, title, description, role, action }: NoticeProps) => (
  <div
    role={role}
    className="flex items-center gap-3 rounded-md border border-dashed border-warning bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-3.5 py-3"
  >
    <Icon name={icon} className="h-6 w-6 flex-none text-warning" />
    <div className="flex-1">
      <b>{title}</b>
      <p className="text-[13px] text-text-muted">{description}</p>
    </div>
    {action && (
      <Button variant="ghost" size="sm" leftIcon={<Icon name="rotate-cw" />} onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

/**
 * Khung video cùng kiểu với Shadowing: thanh tua, phát và âm lượng là của chính YouTube, app chỉ thêm nút ẩn video
 * và các thẻ báo lỗi. Bài âm thanh không có khung hình nên chỉ hiện nhãn "Bài nghe".
 */
export default function MediaBar({ player, videoRef, hideVideo, onToggleVideo }: MediaBarProps) {
  const { t } = useTranslation("dictation");
  const isYouTube = player.kind === "youtube";
  const failed = player.status === "failed";
  const collapsed = hideVideo || failed;
  const hasNotice = failed || player.status === "blocked" || player.status === "nosource";

  if (!isYouTube && player.kind !== "media" && !hasNotice) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)]">
      {isYouTube && (
        <div
          ref={videoRef}
          className={`mx-auto w-full max-w-[660px] overflow-hidden rounded-lg bg-black transition-shadow [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0 ${
            collapsed ? "h-0" : "aspect-video"
          } ${player.playing ? "ring-2 ring-fn-dictation" : ""}`}
        />
      )}
      {player.kind === "media" && (
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-border-strong bg-surface-glass px-2.5 py-1 text-xs font-semibold">
          <Icon name="audio-lines" />
          {t("media.audio")}
        </span>
      )}
      {isYouTube && !failed && (
        <button
          type="button"
          aria-pressed={hideVideo}
          onClick={onToggleVideo}
          className="inline-flex cursor-pointer items-center gap-1.5 self-end rounded-full border-0 bg-transparent px-2.5 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <Icon name={hideVideo ? "eye" : "eye-off"} />
          {hideVideo ? t("media.showVideo") : t("media.hideVideo")}
        </button>
      )}

      {failed && (
        <Notice
          role="alert"
          icon="video-off"
          title={t("media.failTitle")}
          description={t("media.failDesc")}
          action={{ label: t("media.reload"), onClick: player.retry }}
        />
      )}
      {player.status === "blocked" && (
        <Notice role="alert" icon="volume-x" title={t("media.blockedTitle")} description={t("media.blockedDesc")} action={{ label: t("media.reload"), onClick: player.retry }} />
      )}
      {player.status === "nosource" && (
        <Notice role="status" icon="video-off" title={t("media.noSourceTitle")} description={t("media.noSourceDesc")} />
      )}
    </div>
  );
}
