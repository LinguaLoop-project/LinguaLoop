import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";

type PreviewMode = "shadowing" | "dictation";
type FocusWordKey = "thought" | "weather" | "through";
type BlankStatus = "idle" | "correct" | "missing" | "homophone" | "spelling";

const SAMPLE_SENTENCE = "I thought this weather would last through Thursday.";

const SHADOWING_WORDS: { text: string; start: number; state: "good" | "mid" | "weak"; key?: FocusWordKey }[] = [
  { text: "I", start: 0, state: "good" },
  { text: "thought", start: 2, state: "weak", key: "thought" },
  { text: "this", start: 10, state: "good" },
  { text: "weather", start: 15, state: "mid", key: "weather" },
  { text: "would", start: 23, state: "good" },
  { text: "last", start: 29, state: "good" },
  { text: "through", start: 34, state: "weak", key: "through" },
  { text: "Thursday.", start: 42, state: "good" },
];

const WAVE_BARS = [42, 76, 56, 94, 68, 100, 52, 86, 64, 92, 48, 82, 60, 44] as const;

const SHADOWING_METRICS = [
  { key: "accuracy", value: 82 },
  { key: "fluency", value: 89 },
  { key: "completeness", value: 96 },
  { key: "prosody", value: 78 },
] as const;

function gradeBlank(raw: string, expected: "this" | "weather"): BlankStatus {
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z']/g, "");
  if (!cleaned) return "missing";
  if (cleaned === expected) return "correct";
  if (expected === "weather" && cleaned === "whether") return "homophone";
  return "spelling";
}

function inputToneClass(status: BlankStatus) {
  switch (status) {
    case "correct":
      return "border-success/70 bg-success/10 text-success";
    case "missing":
      return "border-danger/70 bg-danger/10 text-danger";
    case "homophone":
      return "border-warning/70 bg-warning/15 text-warning";
    case "spelling":
      return "border-info/70 bg-info/15 text-info";
    default:
      return "border-primary/45 bg-bg-base/80 text-text focus:border-primary";
  }
}

/** Khối xem trước tương tác trên Hero: bấm sửa âm vị + nghe mẫu ở Shadowing, và gõ thử ô trống ở Nghe chép. */
export default function HeroPreview() {
  const { t } = useTranslation("landing");
  const [mode, setMode] = useState<PreviewMode>("shadowing");
  const [selectedWord, setSelectedWord] = useState<FocusWordKey>("thought");
  const [speaking, setSpeaking] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const timerRef = useRef<number | null>(null);
  const boundarySeenRef = useRef(false);

  const [blank1, setBlank1] = useState("");
  const [blank2, setBlank2] = useState("");
  const [checked, setChecked] = useState(false);

  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  const stopFallbackTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopFallbackTimer();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (!canSpeak) return;
    if (speaking) {
      stopFallbackTimer();
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setActiveWordIndex(-1);
      return;
    }
    stopFallbackTimer();
    window.speechSynthesis.cancel();
    boundarySeenRef.current = false;

    const utterance = new SpeechSynthesisUtterance(SAMPLE_SENTENCE);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.onboundary = (event) => {
      if (typeof event.charIndex !== "number") return;
      boundarySeenRef.current = true;
      stopFallbackTimer();
      let idx = 0;
      for (let i = 0; i < SHADOWING_WORDS.length; i += 1) {
        if (event.charIndex >= SHADOWING_WORDS[i].start) idx = i;
      }
      setActiveWordIndex(idx);
      const focusKey = SHADOWING_WORDS[idx]?.key;
      if (focusKey) setSelectedWord(focusKey);
    };
    utterance.onend = () => {
      stopFallbackTimer();
      setSpeaking(false);
      setActiveWordIndex(-1);
    };
    utterance.onerror = () => {
      stopFallbackTimer();
      setSpeaking(false);
      setActiveWordIndex(-1);
    };

    setSpeaking(true);
    setActiveWordIndex(0);

    // Dự phòng cho trình duyệt/giọng đọc không phát sự kiện onboundary
    let step = 0;
    timerRef.current = window.setInterval(() => {
      if (boundarySeenRef.current) {
        stopFallbackTimer();
        return;
      }
      step += 1;
      if (step >= SHADOWING_WORDS.length) {
        stopFallbackTimer();
        return;
      }
      setActiveWordIndex(step);
      const focusKey = SHADOWING_WORDS[step]?.key;
      if (focusKey) setSelectedWord(focusKey);
    }, 360);

    window.speechSynthesis.speak(utterance);
  };

  const status1: BlankStatus = checked ? gradeBlank(blank1, "this") : "idle";
  const status2: BlankStatus = checked ? gradeBlank(blank2, "weather") : "idle";

  const handleCheckDictation = (e: FormEvent) => {
    e.preventDefault();
    setChecked(true);
  };

  const handleTryHomophone = () => {
    setBlank1("");
    setBlank2("whether");
    setChecked(true);
  };

  const handleResetDictation = () => {
    setBlank1("");
    setBlank2("");
    setChecked(false);
  };

  const dictationFeedbackKey = !checked
    ? "feedbackIdle"
    : status1 === "correct" && status2 === "correct"
      ? "feedbackPerfect"
      : status2 === "homophone"
        ? "feedbackHomophone"
        : "feedbackError";

  const activeTip = {
    phoneme: t(`hero.preview.shadowing.wordTips.${selectedWord}.phoneme`),
    score: t(`hero.preview.shadowing.wordTips.${selectedWord}.score`),
    title: t(`hero.preview.shadowing.wordTips.${selectedWord}.title`),
    body: t(`hero.preview.shadowing.wordTips.${selectedWord}.body`),
  };

  return (
    <div className="relative">
      {/* Vầng sáng nền dịu phía sau thẻ xem trước */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[32px] bg-[radial-gradient(65%_60%_at_50%_40%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_72%)]"
      />

      {/* Mascot Loopi trên màn hình lớn (mobile có chip Loopi riêng ở Hero để giữ đúng 1 mascot hiển thị) */}
      <div className="pointer-events-none absolute -right-2 -top-12 z-20 hidden sm:block">
        <Mascot mood="hello" size={96} alt={t("hero.loopiAlt")} className="animate-loopi-float drop-shadow-md" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-strong bg-surface-glass shadow-[var(--shadow-card)] backdrop-blur-[18px]">
        {/* Thanh chuyển chế độ xem trước */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg-elevated/80 px-4 py-3">
          <div role="tablist" aria-label={t("hero.preview.caption")} className="inline-flex rounded-md border border-border bg-bg-base/70 p-1">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "shadowing"}
              onClick={() => setMode("shadowing")}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "shadowing"
                  ? "bg-fn-shadowing-soft text-fn-shadowing"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Icon name="mic" className="text-sm" />
              {t("hero.preview.tabs.shadowing")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "dictation"}
              onClick={() => setMode("dictation")}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "dictation"
                  ? "bg-fn-dictation-soft text-fn-dictation"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Icon name="headphones" className="text-sm" />
              {t("hero.preview.tabs.dictation")}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canSpeak && (
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-xs font-semibold transition-colors ${
                  speaking
                    ? "border-primary/40 bg-primary-soft text-primary-text"
                    : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
                }`}
              >
                <Icon name={speaking ? "square" : "volume-2"} className="text-xs" />
                {speaking ? t("hero.preview.shadowing.stopBtn") : t("hero.preview.shadowing.listenBtn")}
              </button>
            )}
            <Badge variant="B1">B1</Badge>
          </div>
        </div>

        {/* Nội dung xem trước */}
        <div className="p-5 sm:p-6">
          {mode === "shadowing" ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-text-muted">{t("hero.preview.shadowing.lesson")}</span>
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1.5 font-display text-xl font-bold leading-snug sm:text-[22px]">
                    {SHADOWING_WORDS.map((word, index) => {
                      const isSpoken = speaking && activeWordIndex === index;
                      return word.key ? (
                        <button
                          key={word.text}
                          type="button"
                          onClick={() => setSelectedWord(word.key!)}
                          aria-pressed={selectedWord === word.key}
                          className={`rounded-sm px-1.5 py-0.5 transition-all duration-150 ${
                            word.state === "weak"
                              ? "bg-danger/15 text-danger underline decoration-danger/60 decoration-wavy underline-offset-4 hover:bg-danger/25"
                              : "bg-warning/15 text-warning underline decoration-warning/60 decoration-dotted underline-offset-4 hover:bg-warning/25"
                          } ${selectedWord === word.key ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""} ${
                            isSpoken ? "scale-105 bg-primary-soft text-primary-text" : ""
                          }`}
                        >
                          {word.text}
                        </button>
                      ) : (
                        <span
                          key={word.text}
                          className={`rounded-sm px-0.5 py-0.5 transition-all duration-150 ${
                            isSpoken ? "scale-105 bg-primary-soft px-1.5 text-primary-text" : "text-text"
                          }`}
                        >
                          {word.text}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-text-subtle">
                    <Icon name="crosshair" className="text-primary-text" />
                    {t("hero.preview.shadowing.tapWordHint")}
                  </p>
                </div>

                {/* Vòng điểm tổng */}
                <div className="flex shrink-0 flex-col items-center rounded-lg border border-border bg-surface px-3.5 py-2.5 text-center">
                  <span className="font-display text-3xl font-bold leading-none tabular-nums text-success">84</span>
                  <span className="mt-1 text-[11px] font-medium text-text-muted">{t("hero.preview.shadowing.scoreLabel")}</span>
                </div>
              </div>

              {/* Thanh sóng âm chạy chữ theo nhịp đọc */}
              {canSpeak && (
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                    speaking
                      ? "border-primary/45 bg-primary-soft/60"
                      : "border-border bg-bg-elevated/75 hover:border-border-strong"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm transition-colors ${
                      speaking ? "bg-primary text-white" : "bg-primary-soft text-primary-text"
                    }`}
                  >
                    <Icon name={speaking ? "square" : "play"} fill={!speaking} className="text-xs" />
                  </span>

                  <span aria-hidden="true" className="flex h-6 flex-1 items-center gap-1">
                    {WAVE_BARS.map((heightPct, idx) => (
                      <span
                        key={idx}
                        style={{
                          height: `${heightPct}%`,
                          animationDelay: `${idx * 55}ms`,
                        }}
                        className={`w-1 flex-1 rounded-full transition-colors ${
                          speaking
                            ? "animate-wave-bar bg-gradient-to-t from-fn-shadowing to-primary"
                            : "bg-border-strong/80"
                        }`}
                      />
                    ))}
                  </span>

                  <span className="hidden shrink-0 text-xs font-medium text-text-muted sm:inline">
                    {speaking ? t("hero.preview.shadowing.waveformPlaying") : t("hero.preview.shadowing.waveformIdle")}
                  </span>
                </button>
              )}

              {/* 4 điểm thành phần */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {SHADOWING_METRICS.map((m) => (
                  <div key={m.key} className="rounded-md border border-border bg-bg-elevated/70 px-3 py-2">
                    <span className="block text-[11px] text-text-muted">{t(`hero.preview.shadowing.metrics.${m.key}`)}</span>
                    <span className="mt-0.5 block font-display text-base font-bold tabular-nums text-text">{m.value}%</span>
                  </div>
                ))}
              </div>

              {/* Khối mẹo sửa âm vị thay đổi động theo từ đã bấm */}
              <div className="rounded-lg border border-fn-shadowing/30 bg-fn-shadowing-soft/70 p-4 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 items-center rounded-sm bg-danger/20 px-2 font-mono text-sm font-bold text-danger">
                      {activeTip.phoneme}
                    </span>
                    <span className="text-sm font-semibold text-text">{activeTip.title}</span>
                    <Badge variant={Number(activeTip.score) < 60 ? "danger" : "warning"}>{activeTip.score}</Badge>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-fn-shadowing">
                    <Icon name="video" className="text-sm" />
                    {t("hero.preview.shadowing.mouthVideo")}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-text-muted">{activeTip.body}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckDictation} className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-medium text-text-muted">{t("hero.preview.dictation.lesson")}</span>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 font-display text-lg font-bold leading-relaxed sm:text-xl">
                  <span className="text-text">I</span>
                  <span className="text-text">thought</span>
                  <input
                    type="text"
                    value={blank1}
                    onChange={(e) => {
                      setBlank1(e.target.value);
                      if (checked) setChecked(false);
                    }}
                    aria-label={t("hero.preview.dictation.placeholder1")}
                    placeholder={t("hero.preview.dictation.placeholder1")}
                    className={`h-9 w-24 rounded-sm border px-2.5 font-body text-sm font-semibold outline-none transition-colors ${inputToneClass(status1)}`}
                  />
                  <input
                    type="text"
                    value={blank2}
                    onChange={(e) => {
                      setBlank2(e.target.value);
                      if (checked) setChecked(false);
                    }}
                    aria-label={t("hero.preview.dictation.placeholder2")}
                    placeholder={t("hero.preview.dictation.placeholder2")}
                    className={`h-9 w-32 rounded-sm border px-2.5 font-body text-sm font-semibold outline-none transition-colors ${inputToneClass(status2)}`}
                  />
                  <span className="text-text">would</span>
                  <span className="text-text">last</span>
                  <span className="rounded-sm border border-primary/40 bg-primary-soft px-2 py-0.5 text-primary-text">
                    through
                  </span>
                  <span className="text-text">Thursday.</span>
                </div>
              </div>

              {/* Thanh thao tác thử chấm ngay */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-fn-dictation px-3 text-xs font-semibold text-on-fn transition-opacity hover:opacity-90"
                >
                  <Icon name="check" className="text-sm" />
                  {t("hero.preview.dictation.checkBtn")}
                </button>
                <button
                  type="button"
                  onClick={handleTryHomophone}
                  className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-warning/40 bg-warning/10 px-3 text-xs font-semibold text-warning transition-colors hover:bg-warning/20"
                >
                  <Icon name="sparkles" className="text-sm" />
                  {t("hero.preview.dictation.tryHomophoneBtn")}
                </button>
                {(checked || blank1 || blank2) && (
                  <button
                    type="button"
                    onClick={handleResetDictation}
                    className="inline-flex h-8 items-center gap-1 rounded-sm border border-border px-2.5 text-xs font-medium text-text-muted hover:bg-surface-hover hover:text-text"
                  >
                    <Icon name="rotate-ccw" className="text-xs" />
                    {t("hero.preview.dictation.resetBtn")}
                  </button>
                )}
              </div>

              {/* Phản hồi chấm tức thì */}
              <div
                className={`rounded-md border px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  !checked
                    ? "border-border bg-bg-elevated/60 text-text-muted"
                    : status1 === "correct" && status2 === "correct"
                      ? "border-success/35 bg-success/10 text-success"
                      : status2 === "homophone"
                        ? "border-warning/35 bg-warning/10 text-warning"
                        : "border-danger/35 bg-danger/10 text-danger"
                }`}
              >
                {t(`hero.preview.dictation.${dictationFeedbackKey}`)}
              </div>

              {/* Chú thích phân loại lỗi */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
                  {t("hero.preview.dictation.legend.correct")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2 w-2 rounded-full bg-danger" />
                  {t("hero.preview.dictation.legend.missing")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2 w-2 rounded-full bg-warning" />
                  {t("hero.preview.dictation.legend.homophone")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2 w-2 rounded-full bg-info" />
                  {t("hero.preview.dictation.legend.spelling")}
                </span>
              </div>

              {/* Hộp tra từ điển 1 chạm */}
              <div className="rounded-lg border border-fn-dictation/30 bg-bg-elevated/90 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-base font-bold text-text">{t("hero.preview.dictation.dictWord")}</span>
                    <span className="font-mono text-xs text-text-muted">{t("hero.preview.dictation.dictIpa")}</span>
                  </div>
                  <Badge variant="success">
                    <Icon name="bookmark-check" />
                    {t("hero.preview.dictation.dictSaved")}
                  </Badge>
                </div>
                <p className="mt-1 text-[13px] text-text-muted">{t("hero.preview.dictation.dictMeaning")}</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
