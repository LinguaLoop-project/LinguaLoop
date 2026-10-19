import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import { getYouTubeVideoId } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import DictationError from "../components/DictationError";
import DictationSkeleton from "../components/DictationSkeleton";
import FullInput from "../components/FullInput";
import LevelSwitch from "../components/LevelSwitch";
import MediaBar from "../components/MediaBar";
import PlayerControls from "../components/PlayerControls";
import ResultDiff from "../components/ResultDiff";
import SentenceList from "../components/SentenceList";
import SettingsPopover from "../components/SettingsPopover";
import ShortcutsPopover from "../components/ShortcutsPopover";
import {
  useDictationLesson,
  useDictationPrompt,
  useDictationSettings,
  useOnlineStatus,
  useSubmitAttempt,
} from "../hooks";
import type { AttemptResult, DictationLesson, DictationLevel, PlaybackRate, PlayableLevel } from "../types";
import { useDictationShortcuts } from "../useDictationShortcuts";
import { usePlayer } from "../usePlayer";
import { firstUndoneIndex, isNetworkError, MAX_DURATION_MS } from "../utils";

const AUTOPLAY_DELAY_MS = 300;

const Alert = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <div
    role="alert"
    className="mb-3 flex items-center gap-2.5 rounded-md border border-dashed border-warning bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-3.5 py-2.5 text-sm"
  >
    <Icon name={icon} className="h-5 w-5 flex-none text-warning" />
    <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1">{children}</div>
  </div>
);

/** Phần làm bài của một bài đã tải xong: điều phối câu hiện tại, trình phát, nộp bài và kết quả. */
function DictationWorkspace({ lesson }: { lesson: DictationLesson }) {
  const { t } = useTranslation("dictation");
  const navigate = useNavigate();
  const sentences = lesson.sentences;
  const total = sentences.length;

  const [settings, updateSettings] = useDictationSettings();
  const online = useOnlineStatus();
  const submitAttempt = useSubmitAttempt(lesson.slug);

  const [index, setIndex] = useState(() => Math.max(0, firstUndoneIndex(sentences, -1)));
  const [typed, setTyped] = useState("");
  const [replays, setReplays] = useState(0);
  const [workLevel, setWorkLevel] = useState<PlayableLevel>(settings.level);
  /** Các câu đang được làm lại; lượt nộp tiếp theo của chúng gửi `retry = true`. */
  const [redo, setRedo] = useState<ReadonlySet<string>>(() => new Set());
  /** Kết quả từng từ của các câu làm trong phiên này (backend chưa trả lại chi tiết của lượt cũ). */
  const [results, setResults] = useState<Record<string, AttemptResult>>({});

  const startedAt = useRef<number | null>(null);
  const autoplayTimer = useRef<number | undefined>(undefined);
  const resumeShown = useRef(false);
  const videoRef = useRef<HTMLDivElement>(null);

  const videoId = getYouTubeVideoId(lesson.sourceUrl);
  const player = usePlayer({
    videoId,
    mediaUrl: videoId ? null : lesson.sourceUrl || null,
    containerRef: videoRef,
    rate: settings.rate,
  });

  const sentence = sentences[index];
  const mode: "work" | "review" = sentence.latest && !redo.has(sentence.id) ? "review" : "work";
  const result = results[sentence.id] ?? null;
  const canPlay = player.status === "ready" || player.status === "blocked";
  const nothingLeft = firstUndoneIndex(sentences, index) < 0;

  const promptQuery = useDictationPrompt(sentence.id, "normal", mode === "work" && workLevel === "normal");
  const slotLengths =
    workLevel === "normal"
      ? (promptQuery.data?.tokens.flatMap((token) => (token.length == null ? [] : [token.length])) ?? null)
      : null;

  useEffect(() => {
    startedAt.current = Date.now();
    return () => window.clearTimeout(autoplayTimer.current);
  }, []);

  useEffect(() => {
    if (resumeShown.current) return;
    resumeShown.current = true;
    const done = sentences.filter((s) => s.latest).length;
    if (done > 0) toast(t("state.resumed", { n: index + 1, done, total }), { icon: "history" });
  }, [sentences, index, total, t]);

  /** Chuyển sang câu `next`, xóa chữ đã gõ và đếm lại từ đầu. */
  const begin = (next: number, autoplay = false) => {
    window.clearTimeout(autoplayTimer.current);
    player.stop();
    submitAttempt.reset();
    setIndex(next);
    setTyped("");
    setReplays(0);
    setWorkLevel(settings.level);
    startedAt.current = Date.now();
    const target = sentences[next];
    if (autoplay && !target.latest) {
      autoplayTimer.current = window.setTimeout(() => {
        setReplays(1);
        player.playSentence(target.startMs, target.endMs);
      }, AUTOPLAY_DELAY_MS);
    }
  };

  const playCurrent = () => {
    if (!canPlay) return;
    if (player.playing) {
      player.stop();
      return;
    }
    replayCurrent();
  };

  const replayCurrent = () => {
    if (!canPlay) return;
    if (mode === "work") setReplays((n) => n + 1);
    player.playSentence(sentence.startMs, sentence.endMs);
  };

  const submit = () => {
    if (mode !== "work" || submitAttempt.isPending) return;
    if (!typed.trim()) {
      toast(t("input.empty"), { icon: "keyboard" });
      return;
    }
    const elapsed = Date.now() - (startedAt.current ?? Date.now());
    submitAttempt.mutate(
      {
        sentenceId: sentence.id,
        body: {
          level: workLevel,
          typedText: typed,
          playbackRate: settings.rate,
          replayCount: replays,
          durationMs: Math.min(elapsed, MAX_DURATION_MS),
          retry: redo.has(sentence.id),
        },
      },
      {
        onSuccess: (attempt) => {
          player.stop();
          setResults((prev) => ({ ...prev, [sentence.id]: attempt }));
          setRedo((prev) => new Set([...prev].filter((id) => id !== sentence.id)));
        },
      },
    );
  };

  const goNext = () => {
    const next = firstUndoneIndex(sentences, index);
    if (next < 0) {
      navigate(`/student/lessons/${lesson.slug}`);
      return;
    }
    begin(next, settings.autoNext);
  };

  const redoSentence = () => {
    player.stop();
    submitAttempt.reset();
    setRedo((prev) => new Set(prev).add(sentence.id));
    setResults((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== sentence.id)));
    setTyped("");
    setReplays(0);
    setWorkLevel(settings.level);
    startedAt.current = Date.now();
  };

  const changeLevel = (level: DictationLevel) => {
    if (level === "easy") {
      toast(t("level.easySoon"), { icon: "lock" });
      return;
    }
    if (level === settings.level && level === workLevel) return;
    updateSettings({ level });
    const label = t(`level.${level}`);
    if (mode === "work" && typed.trim() === "") {
      setWorkLevel(level);
      toast(t("level.changed", { level: label }), { icon: "sliders-horizontal" });
    } else {
      toast(t("level.changedNext", { level: label }), { icon: "sliders-horizontal" });
    }
  };

  const changeRate = (rate: PlaybackRate) => {
    updateSettings({ rate });
    player.stop();
  };

  const prevSentence = () => {
    if (index > 0) begin(index - 1);
    else toast(t("state.firstSentence"), { icon: "arrow-up" });
  };
  const nextSentence = () => {
    if (index < total - 1) begin(index + 1);
  };

  useDictationShortcuts({
    onPlay: playCurrent,
    onNext: goNext,
    onPrevSentence: prevSentence,
    onNextSentence: nextSentence,
    onLevel: changeLevel,
    mode,
  });

  const shownLevel: DictationLevel = mode === "review" ? (result?.level ?? sentence.latest?.level ?? workLevel) : workLevel;

  return (
    <section className="w-full" id="v-dictation">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to={`/student/lessons/${lesson.slug}`}
            className="mb-0.5 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
          >
            <Icon name="arrow-left" />
            <span>{lesson.title}</span>
          </Link>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-fn-dictation">
            {lesson.difficulty ? t("overlineWithLevel", { cefr: lesson.difficulty }) : t("overline")}
          </div>
          <h1 className="text-[30px]">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LevelSwitch value={settings.level} onChange={changeLevel} />
          <SettingsPopover settings={settings} onChange={updateSettings} />
          <ShortcutsPopover />
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <MediaBar
            player={player}
            videoRef={videoRef}
            sentences={sentences}
            currentIndex={index}
            lessonDurationSec={lesson.durationSec}
            hideVideo={settings.hideVideo}
            onToggleVideo={() => updateSettings({ hideVideo: !settings.hideVideo })}
            onSelect={(i) => i !== index && begin(i)}
          />
          <div className="@container rounded-xl border border-border bg-surface px-[18px] py-3.5 shadow-[var(--shadow-card)]">
            <PlayerControls
              index={index}
              total={total}
              replays={replays}
              level={shownLevel}
              playing={player.playing}
              canPlay={canPlay}
              rate={settings.rate}
              onPrev={prevSentence}
              onNext={nextSentence}
              onPlay={playCurrent}
              onReplay={replayCurrent}
              onRate={changeRate}
            />
            {mode === "work" ? (
              <>
                {!online && !submitAttempt.isError && <Alert icon="wifi-off">{t("state.offline")}</Alert>}
                {submitAttempt.isError && (
                  <Alert icon="circle-alert">
                    <span>{isNetworkError(submitAttempt.error) ? t("state.offline") : t("state.submitFailed")}</span>
                    <Button variant="text" size="sm" onClick={submit}>
                      {t("state.retry")}
                    </Button>
                  </Alert>
                )}
                <FullInput
                  key={sentence.id}
                  value={typed}
                  onChange={setTyped}
                  onSubmit={submit}
                  submitting={submitAttempt.isPending}
                  slotLengths={slotLengths}
                />
              </>
            ) : (
              <>
                <ResultDiff
                  score={result?.score ?? sentence.latest?.score ?? 0}
                  level={shownLevel}
                  words={result?.words ?? null}
                  text={result?.text ?? sentence.text}
                  textVi={result?.textVi ?? sentence.textVi}
                  showTranslation={settings.showTranslation}
                />
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <Button variant="ghost" size="sm" leftIcon={<Icon name="rotate-ccw" />} onClick={redoSentence}>
                    {t("result.again")}
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Icon name="volume-2" />} disabled={!canPlay} onClick={replayCurrent}>
                    {t("result.listenAgain")}
                  </Button>
                  <span className="grow" />
                  <Button
                    onClick={goNext}
                    leftIcon={nothingLeft ? <Icon name="check" /> : undefined}
                    rightIcon={nothingLeft ? undefined : <Icon name="arrow-right" />}
                  >
                    {nothingLeft ? t("result.finish") : t("result.next")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        <SentenceList sentences={sentences} currentIndex={index} onSelect={(i) => i !== index && begin(i)} />
      </div>
    </section>
  );
}

/** Trang `/student/dictation/:slug`. Mỗi bài có state riêng nên đặt `key` theo slug. */
export default function DictationPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  return <DictationSession key={slug} slug={slug} />;
}

function DictationSession({ slug }: { slug: string }) {
  const { t } = useTranslation("dictation");
  const navigate = useNavigate();
  const lessonQuery = useDictationLesson(slug);

  if (lessonQuery.isLoading) return <DictationSkeleton />;

  const lesson = lessonQuery.data;
  if (lessonQuery.isError || !lesson) {
    return (
      <div className="py-6">
        <DictationError error={lessonQuery.error} onRetry={() => void lessonQuery.refetch()} retrying={lessonQuery.isFetching} />
      </div>
    );
  }

  if (lesson.sentences.length === 0) {
    return (
      <EmptyState
        title={t("state.emptyTitle")}
        description={t("state.emptyDesc")}
        actionText={t("backToLesson")}
        onAction={() => navigate(`/student/lessons/${lesson.slug}`)}
      />
    );
  }

  return <DictationWorkspace lesson={lesson} />;
}
