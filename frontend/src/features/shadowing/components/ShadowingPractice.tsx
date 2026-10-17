import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Badge from "@/components/common/Badge";
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
import { useWavRecorder } from "../hooks/useWavRecorder";
import type { LatestAttempt, SentenceRecord } from "../types";
import { recordFromAttempt, toneOf, youtubeId } from "../utils";
import AttemptResult from "./AttemptResult";
import { MessageNote, MicDeniedNote, QuotaOutNote } from "./Notes";
import QuotaChip from "./QuotaChip";
import SentenceList from "./SentenceList";
import SentenceWords from "./SentenceWords";
import WordDetail from "./WordDetail";

const K = "student.shadowingPractice";
const RATES = ["0.5", "0.75", "1"];

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

function Waveform({ levels }: { levels: number[] }) {
  return (
    <div className="flex h-9 items-center gap-[3px]" aria-hidden="true">
      {levels.map((l, i) => (
        <span key={i} className="w-[3px] rounded-full bg-danger" style={{ height: `${Math.max(10, l * 100)}%` }} />
      ))}
    </div>
  );
}

export default function ShadowingPractice({ lesson, sentences, latest }: ShadowingPracticeProps) {
  const { t } = useTranslation("pages");
  const { isPro, remaining, maxActions, setShowUpgradeModal } = useQuota();
  const assess = useAssessAttempt();
  const recorder = useWavRecorder();
  const { stop: stopMic } = recorder;

  const [records, setRecords] = useState(() => recordsFromLatest(latest));
  const [index, setIndex] = useState(() => {
    const first = sentences.findIndex((s) => !latest.some((l) => l.sentenceId === s.id));
    return Math.max(0, first);
  });
  const [rate, setRate] = useState("0.75");
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
  const {
    hostRef: videoHostRef,
    playing: modelPlaying,
    play: playModel,
    stop: stopPlayer,
    showVideo,
    videoFailed,
    retryVideo,
  } = useModelPlayer({ videoId, mediaUrl, rate: Number(rate) });

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

  const goTo = (i: number) => {
    if (busy) return;
    stopPlayer();
    mineAudioRef.current?.pause();
    replaceMine(null);
    setIndex(i);
    setSelected(null);
    setNote(null);
  };

  const goNext = () => {
    const after = sentences.findIndex((s, j) => j > index && !records[s.id]);
    const before = sentences.findIndex((s) => !records[s.id]);
    if (after >= 0) goTo(after);
    else if (before >= 0) goTo(before);
    else if (index < sentences.length - 1) goTo(index + 1);
  };

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

  return (
    <section className="w-full" aria-labelledby="sh-title">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/student/lessons/${lesson.slug}`}
            className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary-text"
          >
            <Icon name="arrow-left" />
            <span className="truncate">{t(`${K}.back`)}: {lesson.title}</span>
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-fn-shadowing">{t(`${K}.overline`)}</div>
          <h1 id="sh-title" className="font-display text-2xl font-bold">
            {t(`${K}.title`)}
          </h1>
        </div>
        <QuotaChip />
      </header>

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Câu mẫu: video YouTube hoặc giọng tổng hợp */}
          <div className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2 text-sm text-text-muted">
              <Icon name={showVideo ? "video" : "headphones"} />
              {showVideo ? t(`${K}.video.badge`) : t(`${K}.video.audioBadge`)}
            </div>
            {showVideo && (
              <div
                ref={videoHostRef}
                className="aspect-video w-full overflow-hidden rounded-md bg-bg-elevated [&_iframe]:h-full [&_iframe]:w-full"
              />
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
          </div>

          <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-text-muted">
                {t(`${K}.sentenceOf`, { n: index + 1, total: sentences.length })}
              </span>
              {sentence.cefrLevel && <Badge variant={sentence.cefrLevel}>{sentence.cefrLevel}</Badge>}
            </div>

            <div className="flex flex-col gap-2">
              <SentenceWords text={sentence.text} words={record?.words ?? []} selected={selected} onSelect={setSelected} />
              {sentence.ipa && <p className="text-sm text-text-subtle">{sentence.ipa}</p>}
              {sentence.textVi && <p className="text-sm text-text-muted">{sentence.textVi}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="secondary"
                onClick={listen}
                disabled={phase === "recording"}
                leftIcon={<Icon name={modelPlaying ? "pause" : "volume-2"} />}
              >
                {modelPlaying ? t(`${K}.stop`) : t(`${K}.listen`)}
              </Button>

              <button
                type="button"
                onClick={onMicClick}
                disabled={phase === "scoring"}
                aria-label={micLabel}
                className={`grid h-16 w-16 shrink-0 cursor-pointer place-items-center rounded-full border-0 text-3xl transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-70 ${
                  phase === "recording" ? "animate-pulse bg-danger text-white" : "bg-fn-shadowing text-on-fn"
                }`}
              >
                <Icon
                  name={phase === "scoring" ? "loader-circle" : phase === "recording" ? "square" : "mic"}
                  className={phase === "scoring" ? "animate-spin" : ""}
                />
              </button>
              <div className="min-w-0 flex-1" role="status" aria-live="polite">
                <div className="text-sm font-medium">{micLabel}</div>
                {phase === "recording" && <Waveform levels={recorder.levels} />}
              </div>

              <SegmentedControl
                ariaLabel={t(`${K}.speed`)}
                options={RATES.map((r) => ({ value: r, label: `${r}×` }))}
                value={rate}
                onChange={setRate}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={playMine} disabled={!mine || busy}>
                {t(`${K}.mine`)}
              </Button>
              <Button variant="ghost" size="sm" onClick={compare} disabled={!mine || busy}>
                {t(`${K}.compare`)}
              </Button>
            </div>

            {note?.kind === "mic" && (
              <MicDeniedNote
                onRetry={() => void startRecording()}
                onListen={() => {
                  setNote(null);
                  playModel(sentence);
                }}
              />
            )}
            {note?.kind === "quota" && (
              <QuotaOutNote
                limit={maxActions}
                showUpgrade={!isPro}
                onUpgrade={() => setShowUpgradeModal(true)}
                onNext={goNext}
                nextLabel={t(`${K}.next`)}
              />
            )}
            {note?.kind === "message" && (
              <MessageNote
                title={note.title}
                body={note.body}
                onRetry={note.retry ? () => retryRef.current?.() : undefined}
              />
            )}
            {!note && outOfAttempts && phase === "idle" && !record && (
              <QuotaOutNote
                limit={maxActions}
                showUpgrade={!isPro}
                onUpgrade={() => setShowUpgradeModal(true)}
                onNext={goNext}
                nextLabel={t(`${K}.next`)}
              />
            )}

            {record && (
              <>
                <AttemptResult record={record} selected={selected} onSelectWord={setSelected} />
                {selectedWord && <WordDetail word={selectedWord} onClose={() => setSelected(null)} />}
              </>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
              <Button variant="ghost" size="sm" disabled={index === 0 || busy} onClick={() => goTo(index - 1)} leftIcon={<Icon name="arrow-left" />}>
                {t(`${K}.prev`)}
              </Button>
              <Button
                variant={record && toneOf(record.score) === "good" ? "primary" : "ghost"}
                size="sm"
                disabled={busy || (finished && index === sentences.length - 1)}
                onClick={goNext}
                rightIcon={<Icon name="arrow-right" />}
              >
                {t(`${K}.next`)}
              </Button>
            </div>
          </div>

          {finished && (
            <div role="status" className="flex flex-wrap items-center gap-4 rounded-lg border border-success/40 bg-success/10 p-5">
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

        <SentenceList sentences={sentences} records={records} current={index} disabled={busy} onGo={goTo} />
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
