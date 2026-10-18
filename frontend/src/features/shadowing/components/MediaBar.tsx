import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";

const K = "student.shadowingPractice";

export interface MediaBarProps {
  /** Đang dùng video YouTube (hiện nút ẩn video). */
  video: boolean;
  hideVideo: boolean;
  onToggleVideo: () => void;
  /** Khung video (kèm thanh điều khiển của YouTube) và thông báo lỗi video. */
  children?: ReactNode;
}

/** Khung video; thanh tua do chính YouTube cung cấp, app chỉ thêm nút ẩn video. */
export default function MediaBar({ video, hideVideo, onToggleVideo, children }: MediaBarProps) {
  const { t } = useTranslation("pages");
  const label = hideVideo ? t(`${K}.video.show`) : t(`${K}.video.hide`);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)]">
      {children}
      {video && (
        <button
          type="button"
          aria-pressed={hideVideo}
          onClick={onToggleVideo}
          className="inline-flex cursor-pointer items-center gap-1.5 self-end rounded-full border-0 bg-transparent px-2.5 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <Icon name={hideVideo ? "eye" : "eye-off"} />
          {label}
        </button>
      )}
    </div>
  );
}
