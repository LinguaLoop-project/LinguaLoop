import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import ToastHost from "@/components/common/ToastHost";
import { toast } from "@/stores/toastStore";
import FeedVideo from "../components/FeedVideo";
import SettingsMenu from "../components/SettingsMenu";
import UpsellSlide from "../components/UpsellSlide";
import { buildEntries, newSeed } from "../feed";
import { useToggleLike, useToggleSaved, useToggleVideoSaved, useWatchFeed } from "../hooks";
import { loadPrefs, savePrefs, type WatchPrefs } from "../prefs";
import type { WatchItem, WatchLine } from "../types";

/** Còn bấy nhiêu ô nữa là hết thì tải trang kế tiếp. */
const PREFETCH_AHEAD = 3;

/**
 * Học thụ động (UC-TC-04): lướt dọc các video ngắn của bài học, mỗi lần một video toàn màn hình. Trang nằm ngoài khung ứng
 * dụng (không thanh bên) để video chiếm trọn màn hình. `?start=<lessonId>` mở từ trang chi tiết bài học.
 */
export default function WatchPage() {
  const { t } = useTranslation("watch");
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const start = params.get("start") ?? undefined;
  const [seed] = useState(newSeed);
  const feed = useWatchFeed(seed, start);
  const like = useToggleLike(seed, start);
  const save = useToggleSaved(seed, start);
  const saveVideo = useToggleVideoSaved(seed, start);
  const [prefs, setPrefs] = useState<WatchPrefs>(loadPrefs);
  const [muted, setMuted] = useState(false);
  const [mutedByBrowser, setMutedByBrowser] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const pages = feed.data?.pages;
  const items = useMemo(() => pages?.flatMap((page) => page.items) ?? [], [pages]);
  const proHidden = pages?.[0]?.proHidden ?? false;
  const entries = useMemo(() => buildEntries(items, proHidden), [items, proHidden]);

  const changePrefs = (next: WatchPrefs) => {
    setPrefs(next);
    savePrefs(next);
  };

  // Ô nào hiện quá nửa màn hình là ô đang xem.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) setActiveIndex(Number((record.target as HTMLElement).dataset.index));
        }
      },
      { root: scroller, threshold: 0.6 },
    );
    scroller.querySelectorAll<HTMLElement>("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entries.length]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && activeIndex >= entries.length - PREFETCH_AHEAD) {
      void fetchNextPage();
    }
  }, [activeIndex, entries.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollBy({ top: direction * scroller.clientHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (document.querySelector("[role='dialog'][aria-modal='true']")) return;
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        scrollBy(1);
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        scrollBy(-1);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [scrollBy]);

  const onAutoplayBlocked = useCallback(() => {
    setMuted(true);
    setMutedByBrowser(true);
  }, []);

  const toggleLike = (item: WatchItem) =>
    like.mutate(
      { lessonId: item.lessonId, liked: !item.liked },
      { onError: () => toast(t("errors.like"), { icon: "circle-alert" }) },
    );
  const toggleSave = (item: WatchItem, line: WatchLine) =>
    save.mutate(
      { lessonId: item.lessonId, sentenceId: line.id, saved: !line.saved },
      {
        onSuccess: () => {
          if (!line.saved) toast(t("savedToast"), { icon: "bookmark-check" });
        },
        onError: () => toast(t("errors.save"), { icon: "circle-alert" }),
      },
    );

  const toggleSaveVideo = (item: WatchItem) =>
    saveVideo.mutate(
      { lessonId: item.lessonId, saved: !item.saved },
      {
        onSuccess: (_data, vars) => {
          if (vars.saved) {
            toast(t("savedVideoToast"), {
              icon: "bookmark-check",
              action: { label: t("viewSaved"), onClick: () => navigate("/student/saved-lessons") },
            });
          }
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.data?.code === "LESSON_PRO_REQUIRED") {
            toast(t("errors.pro"), { icon: "crown", action: { label: t("upsell.cta"), onClick: () => navigate("/pricing") } });
          } else {
            toast(t("errors.saveVideo"), { icon: "circle-alert" });
          }
        },
      },
    );

  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/student");
  };

  return (
    <>
    <div className="fixed inset-0 bg-black text-white">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent px-3 pb-8 pt-3 md:px-5">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            aria-label={t("back")}
            onClick={goBack}
            className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/12 backdrop-blur-md transition-colors hover:bg-white/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Icon name="arrow-left" className="size-5" />
          </button>
          <h1 className="flex items-center gap-2 text-[15px] font-bold">
            <Icon name="monitor-play" className="size-4 text-primary-text" />
            {t("title")}
          </h1>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          {mutedByBrowser && muted && (
            <button
              type="button"
              onClick={() => setMuted(false)}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-black shadow-lg transition-transform hover:scale-[1.02]"
            >
              <Icon name="volume-2" className="size-4" />
              {t("unmute")}
            </button>
          )}
          <button
            type="button"
            aria-label={muted ? t("unmute") : t("mute")}
            aria-pressed={muted}
            onClick={() => {
              setMuted((value) => !value);
              setMutedByBrowser(false);
            }}
            className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/12 backdrop-blur-md transition-colors hover:bg-white/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Icon name={muted ? "volume-x" : "volume-2"} className="size-5" />
          </button>
          <SettingsMenu prefs={prefs} onChange={changePrefs} />
        </div>
      </header>

      {feed.isPending ? (
        <div className="grid h-full place-items-center">
          <span
            role="status"
            aria-label={t("loading")}
            className="size-10 animate-spin rounded-full border-[3px] border-white/25 border-t-white"
          />
        </div>
      ) : feed.isError ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <Icon name="wifi-off" className="size-10 text-white/60" />
          <p className="max-w-sm text-sm text-white/80">{t("errors.feed")}</p>
          <Button leftIcon={<Icon name="refresh-cw" />} isLoading={feed.isFetching} onClick={() => void feed.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <Icon name="clapperboard" className="size-10 text-white/60" />
          <p className="text-lg font-bold">{t("empty.title")}</p>
          <p className="max-w-sm text-sm text-white/70">{t("empty.desc")}</p>
          <Link to="/student/lessons" className="mt-2 text-sm font-semibold text-primary-text underline underline-offset-4">
            {t("empty.cta")}
          </Link>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          aria-label={t("feedAria")}
          className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {entries.map((entry, index) => (
            <section
              key={entry.key}
              data-index={index}
              aria-roledescription={t("slide")}
              className="relative flex h-dvh w-full snap-start snap-always items-center justify-center overflow-hidden"
            >
              {entry.kind === "video" ? (
                <FeedVideo
                  item={entry.item}
                  active={index === activeIndex}
                  prefs={prefs}
                  muted={muted}
                  onAutoplayBlocked={onAutoplayBlocked}
                  onToggleLike={toggleLike}
                  onToggleSave={toggleSave}
                  onToggleSaveVideo={toggleSaveVideo}
                />
              ) : (
                <UpsellSlide />
              )}
            </section>
          ))}
          {isFetchingNextPage && (
            <div className="flex h-24 items-center justify-center">
              <span className="size-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            </div>
          )}
        </div>
      )}
    </div>
    <ToastHost />
    </>
  );
}
