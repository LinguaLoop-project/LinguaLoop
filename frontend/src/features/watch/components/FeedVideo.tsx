import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { ReportDialog } from "@/features/report";
import { youTubeThumbnail } from "@/lib/youtube";
import { activeLineIndex } from "../feed";
import type { WatchPrefs } from "../prefs";
import type { WatchItem, WatchLine } from "../types";
import { useFeedPlayer } from "../useFeedPlayer";
import CaptionBox from "./CaptionBox";
import RailButton from "./RailButton";

export interface FeedVideoProps {
  item: WatchItem;
  /** Video đang hiện trên màn hình: chỉ video này được phát (BR-TC-14). */
  active: boolean;
  prefs: WatchPrefs;
  muted: boolean;
  onAutoplayBlocked: () => void;
  onToggleLike: (item: WatchItem) => void;
  onToggleSave: (item: WatchItem, line: WatchLine) => void;
}

/**
 * Một video trong luồng Học thụ động (UC-TC-04): video, câu đang nói với từ bấm tra được, cột nút Thích, Lưu câu, Luyện bài
 * này và Báo cáo, và thông tin bài ở góc dưới. Mở hộp tra từ hoặc báo cáo thì video tạm dừng, đóng thì phát tiếp.
 */
export default function FeedVideo({
  item,
  active,
  prefs,
  muted,
  onAutoplayBlocked,
  onToggleLike,
  onToggleSave,
}: Readonly<FeedVideoProps>) {
  const { t } = useTranslation("watch");
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const player = useFeedPlayer({
    videoId: item.youtubeId,
    active,
    containerRef,
    rate: prefs.rate,
    muted,
    onAutoplayBlocked,
  });
  const { play, pause, playing, status } = player;
  const [lookupOpen, setLookupOpen] = useState(false);
  const [reportLine, setReportLine] = useState<WatchLine | null>(null);

  const lineIndex = activeLineIndex(item.sentences, player.currentMs);
  const line = lineIndex >= 0 ? item.sentences[lineIndex] : null;
  // Rời video thì hộp tra từ của nó đã đóng theo: bỏ cờ mở để lần quay lại không bị giữ tạm dừng.
  if (!active && lookupOpen) setLookupOpen(false);
  const held = lookupOpen || reportLine !== null;

  // Tạm dừng khi mở hộp tra từ hoặc báo cáo; đóng thì phát tiếp nếu trước đó đang phát (BR-TC-14).
  const playingRef = useRef(playing);
  const resumeRef = useRef(false);
  useEffect(() => {
    playingRef.current = playing;
  });
  useEffect(() => {
    if (held) {
      resumeRef.current = resumeRef.current || playingRef.current;
      pause();
    } else if (resumeRef.current) {
      resumeRef.current = false;
      play();
    }
  }, [held, pause, play]);
  useEffect(() => {
    if (!active) resumeRef.current = false;
  }, [active]);

  const toggle = () => (playing ? pause() : play());
  const showPoster = !active || status !== "ready";

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <div className="relative aspect-video w-full max-w-[calc(100dvh*16/9)] overflow-hidden bg-black">
        <div ref={containerRef} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
        {showPoster && (
          <img
            src={youTubeThumbnail(item.youtubeId)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            loading="lazy"
          />
        )}
        {active && status === "loading" && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="size-10 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
          </span>
        )}
        {active && status === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center text-white">
            <Icon name="wifi-off" className="size-8 text-white/70" />
            <p className="text-sm">{t("errors.video")}</p>
            <Button size="sm" leftIcon={<Icon name="refresh-cw" />} onClick={player.retry}>
              {t("retry")}
            </Button>
          </div>
        )}
        {active && status === "ready" && (
          <button
            type="button"
            aria-label={playing ? t("pause") : t("play")}
            onClick={toggle}
            className="absolute inset-0 grid cursor-pointer place-items-center focus-visible:outline-none"
          >
            {!playing && (
              <span className="grid size-16 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                <Icon name="play" fill className="ml-1 size-7" />
              </span>
            )}
          </button>
        )}
      </div>

      {prefs.captions && line && active && (
        <div className="w-full px-4 pt-4 pr-20 md:absolute md:inset-x-0 md:bottom-[13%] md:px-24 md:pt-0">
          <CaptionBox line={line} currentMs={player.currentMs} prefs={prefs} onLookupChange={setLookupOpen} />
        </div>
      )}

      <div className="absolute bottom-24 right-2 flex flex-col items-center gap-3 md:right-5 md:bottom-[18%]">
        <RailButton
          icon="heart"
          label={item.liked ? t("actions.unlike") : t("actions.like")}
          caption={String(item.likeCount)}
          active={item.liked}
          activeClassName="text-[#fb7185]"
          onClick={() => onToggleLike(item)}
        />
        <RailButton
          icon={line?.saved ? "bookmark-check" : "bookmark-plus"}
          label={line?.saved ? t("actions.saved") : t("actions.save")}
          active={line?.saved ?? false}
          activeClassName="text-[#fcd34d]"
          disabled={!line}
          onClick={() => line && onToggleSave(item, line)}
        />
        <RailButton
          icon="mic"
          label={t("actions.practice")}
          onClick={() => {
            pause();
            navigate(`/student/shadowing/${item.lessonId}`);
          }}
        />
        <RailButton
          icon="flag"
          label={t("actions.report")}
          disabled={!line}
          onClick={() => line && setReportLine(line)}
        />
      </div>

      <div className="absolute bottom-5 left-4 right-24 flex flex-col gap-1.5 text-white md:max-w-[50%]">
        <p className="line-clamp-2 text-[15px] font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{item.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="rounded-md bg-primary px-1.5 py-0.5 text-white">{item.cefrLevel}</span>
          {item.topicName && <span className="rounded-md bg-white/15 px-2 py-0.5 backdrop-blur-sm">{item.topicName}</span>}
          {item.pro && (
            <span className="flex items-center gap-1 rounded-md bg-[#fcd34d]/20 px-2 py-0.5 text-[#fcd34d]">
              <Icon name="crown" className="size-3" />
              Pro
            </span>
          )}
        </div>
      </div>

      {reportLine && (
        <ReportDialog
          targetType="sentence"
          targetId={reportLine.id}
          label={reportLine.textEn}
          current={{
            text_en: reportLine.textEn,
            ipa_us: reportLine.ipaUs,
            ipa_uk: reportLine.ipaUk,
            text_vi: reportLine.textVi,
            start_ms: String(reportLine.startMs),
            end_ms: String(reportLine.endMs),
          }}
          onClose={() => setReportLine(null)}
        />
      )}
    </div>
  );
}
