import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import SegmentedControl from "@/components/common/SegmentedControl";
import { NETWORK_ERROR, toApiError } from "@/features/auth";
import type { LessonDetail, SentenceResponse } from "@/features/lesson/types";
import { useQuota } from "@/hooks/useQuota";
import { toast } from "@/stores/toastStore";
import { useAssessAttempt } from "../hooks/useShadowing";
import { useModelPlayer } from "../hooks/useModelPlayer";
import { useShadowingHotkeys, type ShadowingTab } from "../hooks/useShadowingHotkeys";
import { useShadowingSettings } from "../hooks/useShadowingSettings";
import { useWavRecorder } from "../hooks/useWavRecorder";
import type { LatestAttempt, SentenceRecord } from "../types";
import { alignWords, litTokenIndex, recordFromAttempt, sentenceAt, wordIpa, youtubeId } from "../utils";
import AttemptResult from "./AttemptResult";
import ControlBar from "./ControlBar";
import MediaBar from "./MediaBar";
import { MessageNote, MicDeniedNote, QuotaOutNote } from "./Notes";
import QuotaChip from "./QuotaChip";
import SentenceList from "./SentenceList";
import SentenceWords from "./SentenceWords";
import { SettingsPanel, ShortcutsPanel } from "./ToolbarPanels";
import ToolbarPopover from "./ToolbarPopover";
import WatchPanel from "./WatchPanel";
import WordDetail from "./WordDetail";

const K = "student.shadowingPractice";

type Phase = "idle" | "recording" | "scoring";

type Note =
  | { kind: "mic" }
  | { kind: "quota" }
  | { kind: "message"; title?: string; body: string; retry: boolean };

export interface ShadowingPracticeProps {
  lesson: LessonDetail;
  sentences: SentenceResponse[];
  latest: LatestAttempt[];
}

/** Khôi phục điểm của các câu đã đọc. DB không giữ ký hiệu âm vị của Azure nên `phonemes` rỗng. */
function recordsFromLatest(latest: LatestAttempt[]): Record<string, SentenceRecord> {
  const records: Record<string, SentenceRecord> = {};
  for (const l of latest) {
    records[l.sentenceId] = {
      score: l.score,
      best: l.bestScore,
      count: l.attemptCount,
      accuracy: null,
      fluency: null,
      completeness: null,
      prosody: null,
      words: l.words.map((w) => ({ ...w, phonemes: [] })),
    };
  }
  return records;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function ShadowingPractice({ lesson, sentences, latest }: ShadowingPracticeProps) {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { isPro, remaining, maxActions, setShowUpgradeModal } = useQuota();
  const assess = useAssessAttempt();
  const recorder = useWavRecorder();
  const { stop: stopMic } = recorder;

  const [records, setRecords] = useState(() => recordsFromLatest(latest));
  const [index, setIndex] = useState(() => {
    const first = sentences.findIndex((s) => !latest.some((l) => l.sentenceId === s.id));
    return Math.max(0, first);
  });
  const { settings, update: updateSettings } = useShadowingSettings();
  const [tab, setTab] = useState<ShadowingTab>("practice");
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState<Note | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [mine, setMine] = useState<string | null>(null);
  const mineRef = useRef<string | null>(null);
  const mineAudioRef = useRef<HTMLAudioElement | null>(null);
  /** Gửi lại đúng bản ghi vừa lỗi (lỗi mạng hoặc server, không tính lượt). */
  const retryRef = useRef<(() => void) | null>(null);

  const videoId = lesson.sourceType === "youtube" ? youtubeId(lesson.sourceUrl) : null;
  // Bài âm thanh/video tải lên: phát đoạn của câu từ chính tệp đó
  const mediaUrl = lesson.sourceType === "youtube" ? null : lesson.sourceUrl;
  const seekRef = useRef<(ms: number) => void>(() => undefined);
  const {
    hostRef: videoHostRef,
    audioHostRef,
    showAudio,
    playing: modelPlaying,
    positionMs,
    play: playModel,
    watch: watchAll,
    stop: stopPlayer,
    showVideo,
    videoFailed,
    retryVideo,
  } = useModelPlayer({
    videoId,
    mediaUrl,
    rate: Number(settings.rate),
    onSeek: (ms) => seekRef.current(ms),
  });

  const sentence = sentences[index];
  const record = records[sentence.id];
  const doneCount = sentences.filter((s) => records[s.id]).length;
  const finished = doneCount === sentences.length;
  // remaining === null: không giới hạn hoặc chưa biết số liệu
  const outOfAttempts = remaining !== null && remaining <= 0;
  const busy = phase !== "idle";

  const replaceMine = useCallback((blob: Blob | null) => {
    if (mineRef.current) URL.revokeObjectURL(mineRef.current);
    mineRef.current = blob ? URL.createObjectURL(blob) : null;
    setMine(mineRef.current);
  }, []);

  // Báo một lần khi vào lại bài đã đọc dở
  useEffect(() => {
    if (latest.length > 0) {
      toast(t(`${K}.restored`, { n: index + 1, done: latest.length, total: sentences.length }), { icon: "history" });
    }
    // chỉ chạy lúc vào trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dọn khi rời trang
  useEffect(
    () => () => {
      mineAudioRef.current?.pause();
      if (mineRef.current) URL.revokeObjectURL(mineRef.current);
    },
    [],
  );

  const submit = useCallback(
    (sentenceId: string, wav: Blob) => {
      setPhase("scoring");
      setNote(null);
      assess.mutate(
        { sentenceId, wav },
        {
          onSuccess: (result) => {
            setRecords((prev) => ({ ...prev, [sentenceId]: recordFromAttempt(prev[sentenceId], result) }));
            setSelected(null);
            setPhase("idle");
          },
          onError: (err) => {
            setPhase("idle");
            setNote(noteFromError(err, t));
          },
        },
      );
    },
    [assess, t],
  );

  const stopRecording = useCallback(() => {
    const wav = stopMic();
    if (!wav) {
      setPhase("idle");
      setNote({ kind: "message", body: t(`${K}.notes.tooShort`), retry: false });
      return;
    }
    replaceMine(wav);
    if (outOfAttempts) {
      // Vẫn giữ bản ghi để tự nghe lại, chỉ không chấm (BR-SHADOW-01)
      setPhase("idle");
      setNote({ kind: "quota" });
      return;
    }
    retryRef.current = () => submit(sentence.id, wav);
    submit(sentence.id, wav);
  }, [outOfAttempts, replaceMine, sentence.id, stopMic, submit, t]);

  // Tự dừng khi quá dài: gấp đôi độ dài câu mẫu, trong khoảng 4–20 giây
  useEffect(() => {
    if (phase !== "recording") return;
    const ms = clamp(((sentence.endMs - sentence.startMs) / 1000) * 2, 4, 20) * 1000;
    const id = window.setTimeout(stopRecording, ms);
    return () => window.clearTimeout(id);
  }, [phase, sentence.endMs, sentence.startMs, stopRecording]);

  const startRecording = async () => {
    setNote(null);
    stopPlayer();
    mineAudioRef.current?.pause();
    try {
      await recorder.start();
    } catch {
      setNote({ kind: "mic" });
      return;
    }
    setPhase("recording");
  };

  const onMicClick = () => {
    if (phase === "recording") stopRecording();
    else if (phase === "idle") void startRecording();
  };

  const playMine = () => {
    if (!mine) return;
    mineAudioRef.current?.pause();
    const audio = new Audio(mine);
    mineAudioRef.current = audio;
    void audio.play();
  };

  const listen = () => {
    if (modelPlaying) stopPlayer();
    else playModel(sentence);
  };

  const compare = () => {
    if (!mine) return;
    toast(t(`${K}.compareHint`), { icon: "volume-2" });
    playModel(sentence, () => window.setTimeout(playMine, 250));
  };

  // Người học tự tua / tự phát bằng thanh YouTube: hiện câu chứa vị trí đó (không dừng video)
  useEffect(() => {
    seekRef.current = (ms) => {
      if (phase !== "idle") return;
      const i = sentenceAt(sentences, ms);
      if (i === index) return;
      mineAudioRef.current?.pause();
      replaceMine(null);
      setIndex(i);
      setSelected(null);
      setNote(null);
    };
  });

  const goTo = (i: number) => {
    if (busy) return;
    stopPlayer();
    mineAudioRef.current?.pause();
    replaceMine(null);
    setIndex(i);
    setSelected(null);
    setNote(null);
  };

  /** Bấm một câu trong danh sách: chọn câu và chiếu luôn đoạn mẫu của câu đó (video tua tới đúng đoạn). */
  const pickFromList = (i: number) => {
    if (busy) return;
    if (tab === "watch") {
      // Tab Xem: tua tới câu đó và xem tiếp từ đây
      setIndex(i);
      watchAll(sentences, i, setIndex);
      return;
    }
    goTo(i);
    playModel(sentences[i]);
  };

  const toggleWatch = () => {
    if (modelPlaying) stopPlayer();
    else watchAll(sentences, index, setIndex);
  };

  const switchTab = (next: ShadowingTab) => {
    if (next === tab || busy) return;
    stopPlayer();
    mineAudioRef.current?.pause();
    setSelected(null);
    setNote(null);
    setTab(next);
  };

  const goNext = () => {
    const after = sentences.findIndex((s, j) => j > index && !records[s.id]);
    const before = sentences.findIndex((s) => !records[s.id]);
    if (after >= 0) goTo(after);
    else if (before >= 0) goTo(before);
    else if (index < sentences.length - 1) goTo(index + 1);
  };

  useShadowingHotkeys(
    {
      toggleRecord: onMicClick,
      playModel: listen,
      playMine,
      compare,
      prev: () => {
        if (index > 0) goTo(index - 1);
      },
      next: () => {
        if (index < sentences.length - 1) goTo(index + 1);
      },
      setTab: switchTab,
    },
    tab,
    true,
  );

  const micLabel =
    phase === "recording"
      ? t(`${K}.mic.rec`)
      : phase === "scoring"
        ? t(`${K}.mic.busy`)
        : record
          ? t(`${K}.mic.again`)
          : t(`${K}.mic.idle`);

  const selectedWord = record?.words.find((w) => w.position === selected) ?? null;
  const average = Math.round(
    sentences.reduce((sum, s) => sum + (records[s.id]?.best ?? 0), 0) / Math.max(1, sentences.length),
  );
  const isLastDone = finished && index === sentences.length - 1;

  // Đồng hồ, thanh các câu và từ đang sáng bám theo vị trí phát
  const selectedToken =
    selectedWord === null ? -1 : alignWords(sentence.text, record?.words ?? []).find((d) => d.result === selectedWord)?.tokenIndex ?? -1;
  const selectedIpa = selectedToken >= 0 ? (wordIpa(sentence.text, sentence.ipa)?.[selectedToken] ?? null) : null;
  const wordPhonetics = settings.ipa ? wordIpa(sentence.text, sentence.ipa) : null;
  const lit =
    positionMs !== null && modelPlaying
      ? litTokenIndex(
          sentence.text,
          clamp((positionMs - sentence.startMs) / Math.max(500, sentence.endMs - sentence.startMs), 0, 1),
        )
      : -1;
  const quotaNote = (
    <QuotaOutNote
      limit={maxActions}
      showUpgrade={!isPro}
      onUpgrade={() => setShowUpgradeModal(true)}
      onNext={goNext}
      nextLabel={t(`${K}.next`)}
    />
  );

  return (
    <section className="w-full" aria-labelledby="sh-title">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <Link
            to={`/student/lessons/${lesson.slug}`}
            className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary-text"
          >
            <Icon name="arrow-left" />
            <span className="truncate">
              {t(`${K}.back`)}: {lesson.title}
            </span>
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-fn-shadowing">{t(`${K}.overline`)}</div>
          <h1 id="sh-title" className="font-display text-3xl font-bold">
            {t(`${K}.title`)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel={t(`${K}.tabs.label`)}
            options={[
              { value: "watch", label: t(`${K}.tabs.watch`), icon: <Icon name="play" /> },
              { value: "practice", label: t(`${K}.tabs.practice`), icon: <Icon name="mic" /> },
            ]}
            value={tab}
            onChange={(v) => switchTab(v as ShadowingTab)}
          />
          <ToolbarPopover label={t(`${K}.toolbar.settings`)} icon="settings">
            <SettingsPanel settings={settings} onChange={updateSettings} />
          </ToolbarPopover>
          <ToolbarPopover label={t(`${K}.toolbar.shortcuts`)} icon="keyboard">
            <ShortcutsPanel />
          </ToolbarPopover>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          {(showVideo || videoFailed || showAudio) && (
          <MediaBar
            video={showVideo}
            hideVideo={settings.hideVideo}
            onToggleVideo={() => updateSettings({ hideVideo: !settings.hideVideo })}
          >
            {showVideo && (
              <div
                ref={videoHostRef}
                className={`mx-auto w-full overflow-hidden rounded-lg bg-black transition-shadow [&_iframe]:h-full [&_iframe]:w-full ${
                  tab === "watch" ? "max-w-[960px]" : "max-w-[660px]"
                } ${settings.hideVideo ? "h-0" : "aspect-video"} ${modelPlaying ? "ring-2 ring-fn-shadowing" : ""}`}
              />
            )}
            {showAudio && (
              <div ref={audioHostRef} className="mx-auto w-full max-w-[660px] [&_audio]:block [&_audio]:w-full" />
            )}
            {videoFailed && (
              <div role="status" className="flex flex-wrap items-center gap-3 rounded-md bg-bg-elevated p-3">
                <Icon name="triangle-alert" className="text-xl text-warning" />
                <div className="min-w-48 flex-1">
                  <b className="text-sm">{t(`${K}.video.failTitle`)}</b>
                  <p className="text-sm text-text-muted">{t(`${K}.video.failBody`)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={retryVideo} leftIcon={<Icon name="rotate-cw" />}>
                  {t(`${K}.video.retry`)}
                </Button>
              </div>
            )}
          </MediaBar>
          )}

          <div className="rounded-xl border border-border bg-surface px-[18px] py-3.5 shadow-[var(--shadow-card)] md:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <b className="text-base">{t(`${K}.sentenceOf`, { n: index + 1, total: sentences.length })}</b>
              <span className="text-sm text-text-muted">
                {record ? t(`${K}.readCount`, { count: record.count }) : t(`${K}.unread`)}
              </span>
              <span className="flex-1" />
              {tab === "practice" && <QuotaChip />}
            </div>

            {tab === "watch" ? (
              <WatchPanel
                playing={modelPlaying}
                sentenceNo={index + 1}
                subtitles={settings.subs}
                caption={sentence.text}
                onToggle={toggleWatch}
                onPractice={() => switchTab("practice")}
              />
            ) : (
              <>
                <ControlBar
                  isFirst={index === 0}
                  isLast={index === sentences.length - 1}
                  playing={modelPlaying}
                  rate={settings.rate}
                  phase={phase}
                  micLabel={micLabel}
                  levels={recorder.levels}
                  canPlayMine={!!mine}
                  navDisabled={busy}
                  onPrev={() => goTo(index - 1)}
                  onNext={() => goTo(index + 1)}
                  onReplay={() => playModel(sentence)}
                  onTogglePlay={listen}
                  onRate={(rate) => updateSettings({ rate })}
                  onMine={playMine}
                  onCompare={compare}
                  onMic={onMicClick}
                />

                <SentenceWords
                  text={sentence.text}
                  words={record?.words ?? []}
                  ipa={wordPhonetics}
                  lit={lit}
                  selected={selected}
                  onSelect={setSelected}
                />
                {settings.ipa && sentence.ipa && !wordPhonetics && (
                  <p className="mt-1 text-center text-sm text-text-subtle">{sentence.ipa}</p>
                )}
                {settings.vi && sentence.textVi && (
                  <p className="mb-2 mt-1 text-center text-sm text-text-muted">{sentence.textVi}</p>
                )}

                <div className="mt-3 flex flex-col gap-3 empty:hidden">
                  {note?.kind === "mic" && (
                    <MicDeniedNote
                      onRetry={() => void startRecording()}
                      onListen={() => {
                        setNote(null);
                        playModel(sentence);
                      }}
                    />
                  )}
                  {note?.kind === "quota" && quotaNote}
                  {note?.kind === "message" && (
                    <MessageNote
                      title={note.title}
                      body={note.body}
                      onRetry={note.retry ? () => retryRef.current?.() : undefined}
                    />
                  )}
                  {!note && outOfAttempts && phase === "idle" && !record && quotaNote}
                </div>

                {record && (
                  <>
                    <AttemptResult
                      record={record}
                      isFinish={isLastDone}
                      onListen={listen}
                      onNext={isLastDone ? () => navigate(`/student/lessons/${lesson.slug}`) : goNext}
                    />
                    {selectedWord && (
                      <div className="mt-4">
                        <WordDetail word={selectedWord} ipa={selectedIpa} onClose={() => setSelected(null)} />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {finished && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-4 rounded-xl border border-success/40 bg-success/10 p-5"
            >
              <Mascot mood="celebrate" size={72} alt="" />
              <div className="min-w-48 flex-1">
                <b className="font-display text-lg">{t(`${K}.finished.title`)}</b>
                <p className="text-sm text-text-muted">{t(`${K}.finished.body`, { avg: average })}</p>
              </div>
              <Link to={`/student/lessons/${lesson.slug}`}>
                <Button variant="ghost">{t(`${K}.finished.backToLesson`)}</Button>
              </Link>
            </div>
          )}
        </div>

        <SentenceList
          sentences={sentences}
          records={records}
          current={index}
          disabled={busy}
          revealAll={tab === "watch"}
          showVi={settings.vi}
          onGo={pickFromList}
        />
      </div>
    </section>
  );
}

/** Mã lỗi của server → thông báo cho người học (UC-SHADOW-01). Mọi lỗi này đều không tính vào hạn mức. */
function noteFromError(err: unknown, t: TFunction<"pages">): Note {
  const e = toApiError(err);
  switch (e.code) {
    case "QUOTA_EXCEEDED":
      return { kind: "quota" };
    case "SHADOWING_NO_SPEECH":
      return { kind: "message", body: t(`${K}.notes.noSpeech`), retry: false };
    case "AI_CONSENT_REQUIRED":
      return { kind: "message", body: t(`${K}.notes.consent`), retry: false };
    case "SHADOWING_AUDIO_INVALID":
      return {
        kind: "message",
        body: e.details.reason === "too_long" ? t(`${K}.notes.tooLong`) : t(`${K}.notes.tooShort`),
        retry: false,
      };
    case NETWORK_ERROR:
      return { kind: "message", title: t(`${K}.notes.errorTitle`), body: t(`${K}.notes.errorOffline`), retry: true };
    default:
      return { kind: "message", title: t(`${K}.notes.errorTitle`), body: t(`${K}.notes.errorBody`), retry: true };
  }
}
