import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import { getYouTubeVideoId } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import ClozeInput from "../components/ClozeInput";
import CompletionScreen from "../components/CompletionScreen";
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
  useRevealWord,
  useSubmitAttempt,
} from "../hooks";
import type {
  AttemptResult,
  DictationLesson,
  DictationLevel,
  PlaybackRate,
  HardHint,
  PromptToken,
  RevealedWords,
  RevealWordBody,
  SubmitAttemptBody,
} from "../types";
import { useDictationShortcuts } from "../useDictationShortcuts";
import { usePlayer } from "../usePlayer";
import {
  errorKind,
  firstUndoneIndex,
  isNetworkError,
  MAX_DURATION_MS,
  mergeRevealed,
  submitErrorKind,
  type SubmitErrorKind,
} from "../utils";

const AUTOPLAY_DELAY_MS = 300;

/** Kết quả một câu làm trong phiên này; `context` là đề Easy của lượt đó để hiện cả câu ở màn kết quả. */
interface SessionResult {
  attempt: AttemptResult;
  context: PromptToken[] | null;
}

const SUBMIT_ERROR_TEXT: Record<SubmitErrorKind, (t: TFunction<"dictation">) => string> = {
  offline: (t) => t("state.offline"),
  failed: (t) => t("state.submitFailed"),
  easyUnavailable: (t) => t("errors.easyUnavailable"),
  invalidBlanks: (t) => t("errors.invalidBlanks"),
};

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
  const sentences = lesson.sentences;
  const total = sentences.length;

  const [settings, updateSettings] = useDictationSettings();
  const online = useOnlineStatus();
  const submitAttempt = useSubmitAttempt(lesson.slug);
  const revealWord = useRevealWord();

  const [index, setIndex] = useState(() => Math.max(0, firstUndoneIndex(sentences, -1)));
  const [typed, setTyped] = useState("");
  const [replays, setReplays] = useState(0);
  const [workLevel, setWorkLevel] = useState<DictationLevel>(settings.level);
  /** Easy: chữ đã điền theo `position` của ô. */
  const [blanks, setBlanks] = useState<Record<number, string>>({});
  /** Các từ đã lộ (con mắt ở Easy/Normal, nút Gợi ý ở Hard), theo vị trí token. Tính là sai khi nộp. */
  const [revealed, setRevealed] = useState<RevealedWords>({});
  /** Mỗi lượt làm một câu ở Easy cần đề (bộ ô) riêng; tăng số này để lấy đề mới. */
  const [promptNonce, setPromptNonce] = useState(0);
  /** Gợi ý gần nhất ở mức Hard, hiện bên dưới ô gõ (không sửa chữ của người dùng). */
  const [hint, setHint] = useState<HardHint | null>(null);
  const [finished, setFinished] = useState(false);
  /** Các câu đang được làm lại; lượt nộp tiếp theo của chúng gửi `retry = true`. */
  const [redo, setRedo] = useState<ReadonlySet<string>>(() => new Set());
  /** Kết quả từng từ của các câu làm trong phiên này (backend chưa trả lại chi tiết của lượt cũ). */
  const [results, setResults] = useState<Record<string, SessionResult>>({});

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
  const result = results[sentence.id]?.attempt ?? null;
  const resultContext = results[sentence.id]?.context ?? null;
  const canPlay = player.status === "ready" || player.status === "blocked";
  const nothingLeft = firstUndoneIndex(sentences, index, redo) < 0;

  const promptQuery = useDictationPrompt(sentence.id, workLevel, mode === "work" && workLevel !== "hard", promptNonce);
  const slots =
    workLevel === "normal"
      ? (promptQuery.data?.tokens.flatMap((token) =>
          token.length == null ? [] : [{ position: token.position, length: token.length }],
        ) ?? null)
      : null;
  const hintLengthsQuery = useDictationPrompt(sentence.id, "normal", mode === "work" && workLevel === "hard" && hint !== null);
  const hintLengths = hintLengthsQuery.data?.tokens.flatMap((token) => (token.length == null ? [] : [token.length])) ?? null;
  const easyTokens = workLevel === "easy" ? (promptQuery.data?.tokens ?? null) : null;
  const hasInput = typed.trim() !== "" || Object.values(blanks).some((v) => v.trim() !== "") || Object.keys(revealed).length > 0;

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

  /** Xóa chữ đã gõ, ô đã điền/mở và đếm lại từ đầu cho một lượt làm mới (Easy lấy bộ ô mới). */
  const resetAttempt = (level: DictationLevel) => {
    setTyped("");
    setBlanks({});
    setRevealed({});
    setHint(null);
    setReplays(0);
    setWorkLevel(level);
    setPromptNonce((n) => n + 1);
    startedAt.current = Date.now();
  };

  /** Chuyển sang câu `next` (mức làm mặc định là mức trong cài đặt). */
  const begin = (next: number, autoplay = false, level: DictationLevel = settings.level) => {
    window.clearTimeout(autoplayTimer.current);
    player.stop();
    submitAttempt.reset();
    setIndex(next);
    resetAttempt(level);
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

  const onAttemptDone = (attempt: AttemptResult) => {
    player.stop();
    setResults((prev) => ({ ...prev, [sentence.id]: { attempt, context: workLevel === "easy" ? easyTokens : null } }));
    setRedo((prev) => new Set([...prev].filter((id) => id !== sentence.id)));
  };

  /** Nộp lượt hiện tại; `extra` là phần riêng của từng cách nộp (chữ đã gõ, các ô Easy, bỏ cuộc). */
  const send = (extra: Partial<SubmitAttemptBody>) => {
    const elapsed = Date.now() - (startedAt.current ?? Date.now());
    submitAttempt.mutate(
      {
        sentenceId: sentence.id,
        body: {
          level: workLevel,
          playbackRate: settings.rate,
          replayCount: replays,
          durationMs: Math.min(elapsed, MAX_DURATION_MS),
          retry: redo.has(sentence.id),
          ...extra,
        },
      },
      { onSuccess: onAttemptDone },
    );
  };

  const revealedPositions = () => Object.keys(revealed).map(Number);

  /** Xin backend lộ một từ rồi gọi `apply`; chưa có từ nào để lộ (đã gõ đúng hết) thì chỉ báo. */
  const reveal = (body: RevealWordBody, apply: (position: number, index: number, word: string) => void) => {
    if (revealWord.isPending) return;
    revealWord.mutate(
      { sentenceId: sentence.id, body },
      {
        onSuccess: ({ position, index, word }) => {
          if (position === null || index === null || word === null) {
            toast(t("hint.allCorrect"), { icon: "circle-check" });
            return;
          }
          apply(position, index, word);
        },
        onError: (error) => toast(isNetworkError(error) ? t("hint.offline") : t("hint.failed"), { icon: "wifi-off" }),
      },
    );
  };

  const addRevealed = (position: number, word: string) => setRevealed((prev) => ({ ...prev, [position]: word }));

  /** Con mắt của một ô (Easy) hoặc một từ (Normal). Easy bỏ chữ đã điền dở ở ô đó. */
  const revealAt = (position: number) =>
    reveal({ position }, (revealedPosition, _index, word) => {
      addRevealed(revealedPosition, word);
      setBlanks((prev) => Object.fromEntries(Object.entries(prev).filter(([p]) => Number(p) !== revealedPosition)));
    });

  /** Nút Gợi ý (Hard): lộ từ đúng kế tiếp và hiện bên dưới ô gõ, không đụng vào chữ đã gõ. */
  const showHint = () =>
    reveal({ typedText: typed }, (position, index, word) => {
      addRevealed(position, word);
      setHint({ prefix: typed.split(/\s+/).filter(Boolean).slice(0, index), index, word });
    });

  /** Easy chỉ gửi các ô trống: vị trí, chữ đã điền (trừ ô đã mở) và các ô đã mở. */
  const easyBody = (tokens: PromptToken[]): Partial<SubmitAttemptBody> => ({
    blankPositions: tokens.filter((token) => token.blank).map((token) => token.position),
    blanks: Object.fromEntries(
      Object.entries(blanks).filter(([position, value]) => value.trim() !== "" && !(Number(position) in revealed)),
    ),
    revealedPositions: revealedPositions(),
  });

  const submit = () => {
    if (mode !== "work" || submitAttempt.isPending) return;
    if (workLevel === "easy") {
      if (!easyTokens) return;
      const filled = Object.entries(blanks).some(([position, v]) => v.trim() !== "" && !(Number(position) in revealed));
      if (!filled && revealedPositions().length === 0) {
        toast(t("input.emptyCloze"), { icon: "keyboard" });
        return;
      }
      send(easyBody(easyTokens));
      return;
    }
    const typedText = slots ? mergeRevealed(typed, slots.map((slot) => slot.position), revealed) : typed;
    if (!typedText.trim()) {
      toast(t("input.empty"), { icon: "keyboard" });
      return;
    }
    send({ typedText, revealedPositions: revealedPositions() });
  };

  /** "Hiện cả câu": nộp lượt bỏ cuộc (0 điểm, không vào thống kê); chữ gõ dở bị bỏ. */
  const giveUp = () => {
    if (mode !== "work" || submitAttempt.isPending) return;
    if (workLevel === "easy") {
      if (easyTokens) send({ gaveUp: true, blankPositions: easyBody(easyTokens).blankPositions });
      return;
    }
    send({ gaveUp: true });
  };

  /** Gửi lại đúng lượt vừa thất bại (nộp thường hoặc bỏ cuộc). */
  const retryLast = () => {
    if (submitAttempt.variables) submitAttempt.mutate(submitAttempt.variables, { onSuccess: onAttemptDone });
  };

  const goNext = () => {
    const next = firstUndoneIndex(sentences, index, redo);
    if (next < 0) {
      player.stop();
      setFinished(true);
      return;
    }
    begin(next, settings.autoNext);
  };

  const redoSentence = () => {
    player.stop();
    submitAttempt.reset();
    setRedo((prev) => new Set(prev).add(sentence.id));
    setResults((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== sentence.id)));
    resetAttempt(settings.level);
  };

  /** "Làm lại ở mức khó hơn" ở màn hoàn thành: cả bài thành làm lại, bắt đầu từ câu 1. */
  const redoLesson = (level: DictationLevel) => {
    updateSettings({ level });
    setRedo(new Set(sentences.map((s) => s.id)));
    setResults({});
    setFinished(false);
    begin(0, false, level);
  };

  const reviewSentence = (i: number) => {
    setFinished(false);
    begin(i);
  };

  const changeLevel = (level: DictationLevel) => {
    if (level === settings.level && level === workLevel) return;
    updateSettings({ level });
    const label = t(`level.${level}`);
    if (mode === "work" && !hasInput) {
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

      {finished ? (
        <CompletionScreen lesson={lesson} level={settings.level} onRedo={redoLesson} onSelectSentence={reviewSentence} />
      ) : (
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
                      <span>{SUBMIT_ERROR_TEXT[submitErrorKind(submitAttempt.error)](t)}</span>
                      {["offline", "failed"].includes(submitErrorKind(submitAttempt.error)) && (
                        <Button variant="text" size="sm" onClick={retryLast}>
                          {t("state.retry")}
                        </Button>
                      )}
                    </Alert>
                  )}
                  {workLevel === "easy" ? (
                    promptQuery.isError ? (
                      <Alert icon="circle-alert">
                        {errorKind(promptQuery.error).code === "DICTATION_EASY_UNAVAILABLE" ? (
                          <>
                            <span>{t("level.easyUnavailable")}</span>
                            <Button variant="text" size="sm" onClick={() => setWorkLevel("normal")}>
                              {t("level.useNormal")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <span>{t("state.promptFailed")}</span>
                            <Button variant="text" size="sm" onClick={() => void promptQuery.refetch()}>
                              {t("state.retry")}
                            </Button>
                          </>
                        )}
                      </Alert>
                    ) : easyTokens ? (
                      <ClozeInput
                        key={`${sentence.id}-${promptNonce}`}
                        tokens={easyTokens}
                        values={blanks}
                        revealed={revealed}
                        revealing={revealWord.isPending}
                        onChange={(position, value) => setBlanks((prev) => ({ ...prev, [position]: value }))}
                        onReveal={revealAt}
                        onSubmit={submit}
                        onGiveUp={giveUp}
                        submitting={submitAttempt.isPending}
                      />
                    ) : (
                      <div
                        role="status"
                        aria-label={t("state.promptLoading")}
                        className="h-[120px] animate-pulse rounded-lg border border-border bg-surface-hover"
                      />
                    )
                  ) : (
                    <FullInput
                      key={`${sentence.id}-${promptNonce}`}
                      value={typed}
                      onChange={setTyped}
                      onSubmit={submit}
                      onGiveUp={giveUp}
                      submitting={submitAttempt.isPending}
                      slots={slots}
                      revealed={revealed}
                      revealing={revealWord.isPending}
                      onReveal={revealAt}
                      onHint={showHint}
                      hint={hint}
                      hintLengths={hintLengths}
                    />
                  )}
                </>
              ) : (
                <>
                  <ResultDiff
                    score={result?.score ?? sentence.latest?.score ?? 0}
                    level={shownLevel}
                    words={result?.words ?? null}
                    context={resultContext}
                    gaveUp={result?.gaveUp ?? sentence.latest?.gaveUp ?? false}
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
      )}
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
