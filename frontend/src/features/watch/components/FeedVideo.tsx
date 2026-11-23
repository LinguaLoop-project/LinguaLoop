import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
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
  /** Lưu hoặc bỏ lưu câu đang hiện (BR-TC-17). */
  onToggleSave: (item: WatchItem, line: WatchLine) => void;
  /** Lưu hoặc bỏ lưu cả video vào Bài đã lưu (BR-TC-19). */
  onToggleSaveVideo: (item: WatchItem) => void;
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
  onToggleSaveVideo,
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
  const { play, pause, seekTo, playing, status } = player;
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

  const goPrevLine = useCallback(() => {
    if (lineIndex > 0) {
      const target = item.sentences[lineIndex - 1];
      if (target) seekTo(target.startMs);
    }
  }, [item.sentences, lineIndex, seekTo]);

  const goReplayLine = useCallback(() => {
    if (line) seekTo(line.startMs);
  }, [line, seekTo]);

  const goNextLine = useCallback(() => {
    if (lineIndex >= 0 && lineIndex < item.sentences.length - 1) {
      const target = item.sentences[lineIndex + 1];
      if (target) seekTo(target.startMs);
    }
  }, [item.sentences, lineIndex, seekTo]);

  // Phím tắt tua câu (← câu trước, → câu tiếp, R nghe lại câu) cho video đang xem
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (document.querySelector("[role='dialog'][aria-modal='true']")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevLine();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNextLine();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        goReplayLine();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, goPrevLine, goNextLine, goReplayLine]);

  const toggle = () => (playing ? pause() : play());
  const showPoster = !active || status !== "ready";
  const totalDurationMs =
    (item.durationSec > 0 ? item.durationSec * 1000 : item.sentences.at(-1)?.endMs) ?? 0;
  const progressPercent =
    totalDurationMs > 0 ? Math.min(100, Math.max(0, (player.currentMs / totalDurationMs) * 100)) : 0;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <div className="relative aspect-video w-full max-w-[calc(100dvh*16/9)] overflow-hidden bg-black">
        <div ref={containerRef} className="absolute -inset-x-[7%] -inset-y-[9%] [&_iframe]:h-full [&_iframe]:w-full" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/75 to-transparent" />
        {/* Lớp phủ tối ở đáy để tiêu đề bài, phụ đề và thanh tiến độ luôn rõ nét trên cả các video có nền trắng sáng */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-black/90 via-black/45 to-transparent"
        />
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
              <span className="grid size-16 place-items-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl backdrop-blur-md">
                <Icon name="play" fill className="ml-1 size-7" />
              </span>
            )}
          </button>
        )}
      </div>

      {/* Thanh tiến độ thời lượng video ở sát mép đáy */}
      {active && totalDurationMs > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 mx-auto h-1 w-full max-w-[calc(100dvh*16/9)] bg-white/20"
        >
          <div
            className="h-full bg-primary transition-[width] duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Lớp phủ toàn màn hình dưới đáy đảm bảo thông tin góc trái vẫn nổi rõ nếu màn hình rộng hơn khung 16:9 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
      />

      {line && active && (
        <div className="z-20 w-full px-4 pt-4 pr-20 md:absolute md:inset-x-0 md:bottom-[14%] md:px-24 md:pt-0">
          <CaptionBox
            line={line}
            currentMs={player.currentMs}
            prefs={prefs}
            lineIndex={lineIndex}
            totalLines={item.sentences.length}
            onPrevLine={goPrevLine}
            onReplayLine={goReplayLine}
            onNextLine={goNextLine}
            onLookupChange={setLookupOpen}
            onToggleSave={() => onToggleSave(item, line)}
          />
        </div>
      )}

      <div className="absolute bottom-24 right-2 z-20 flex flex-col items-center gap-3 md:bottom-[18%] md:right-5">
        <RailButton
          icon="heart"
          label={item.liked ? t("actions.unlike") : t("actions.like")}
          caption={String(item.likeCount)}
          active={item.liked}
          activeClassName="text-[#fb7185]"
          onClick={() => onToggleLike(item)}
        />
        <RailButton
          icon="bookmark"
          label={item.saved ? t("actions.savedVideo") : t("actions.saveVideo")}
          caption={item.saved ? t("actions.savedShort") : t("actions.saveShort")}
          active={item.saved}
          activeClassName="text-video-accent"
          onClick={() => onToggleSaveVideo(item)}
        />
        <RailButton
          icon="mic"
          label={t("actions.practice")}
          caption={t("actions.practiceShort")}
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

      <div className="absolute bottom-4 left-4 right-24 z-20 flex flex-col gap-2 text-white md:left-6 md:max-w-[52%]">
        <Link
          to={`/student/lessons/${item.lessonId}`}
          onClick={() => pause()}
          className="group inline-flex w-fit max-w-full items-center gap-1.5 text-[16px] font-bold leading-snug text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] transition-colors hover:text-video-accent"
        >
          <span className="line-clamp-2">{item.title}</span>
          <Icon
            name="arrow-right"
            className="size-4 shrink-0 opacity-75 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
          />
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="rounded-md bg-primary px-2 py-0.5 text-white shadow-sm">{item.cefrLevel}</span>
          {item.topicName && (
            <span className="rounded-md border border-white/20 bg-black/55 px-2 py-0.5 text-white/95 backdrop-blur-md">
              {item.topicName}
            </span>
          )}
          {item.sentences.length > 0 && (
            <span className="rounded-md border border-white/15 bg-black/55 px-2 py-0.5 tabular-nums text-white/85 backdrop-blur-md">
              {t("feed.sentenceCount", { count: item.sentences.length })}
            </span>
          )}
          {item.pro && (
            <span className="flex items-center gap-1 rounded-md border border-video-accent/40 bg-black/65 px-2 py-0.5 text-video-accent">
              <Icon name="crown" className="size-3" />
              Pro
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              pause();
              navigate(`/student/dictation/${item.lessonId}`);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/20 bg-white/12 px-2 py-0.5 text-white transition-colors hover:bg-white/25 backdrop-blur-md"
          >
            <Icon name="headphones" className="size-3" />
            <span>{t("feed.dictation")}</span>
          </button>
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
