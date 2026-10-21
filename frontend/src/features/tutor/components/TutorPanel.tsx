import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { useTutorSession } from "../useTutorSession";
import type { TutorSummary } from "../types";
import { formatClock } from "../utils";
import TutorFallback from "./TutorFallback";
import TutorResult from "./TutorResult";
import TutorScoring from "./TutorScoring";
import TutorStage from "./TutorStage";
import WordChips from "./WordChips";

const K = "student.tutor.panel";

export interface TutorPanelProps {
  /** Lượt shadowing vừa chấm; backend tự đọc kết quả của lượt này. */
  attemptId: number;
  sentence: string;
  /** Mã lời mời học viên đã nhận; null khi tự bấm "Hỏi gia sư". */
  offerId: string | null;
  /** Vào phiên ngay khi hiện (sau đếm ngược 3 giây hoặc "Hỏi gia sư"), không chờ bấm. */
  autoStart?: boolean;
  isPro: boolean;
  /** "Tiếp tục bài": đóng khung, quay lại bài shadowing. */
  onClose: () => void;
  /** Phiên đã có kết quả (kể cả không kết nối được); bài học ghi lại để hiện dòng "Gia sư: ...". */
  onEnded?: (summary: TutorSummary) => void;
  onUpgrade: () => void;
}

/** Phần tử có thao tác riêng với phím Space (bấm nút, gõ chữ): phím tắt giữ để đọc không được chen vào. */
const isInteractive = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && target.closest("button, a, input, textarea, select, [contenteditable]") !== null;

/** Khung Phiên gia sư trong trang Shadowing: trò chuyện, Lượt chấm, kết quả và dự phòng. */
export default function TutorPanel({
  attemptId,
  sentence,
  offerId,
  autoStart = false,
  isPro,
  onClose,
  onEnded,
  onUpgrade,
}: TutorPanelProps) {
  const { t } = useTranslation("pages");
  const { state, controller } = useTutorSession({ attemptId, offerId });
  const { phase, limits } = state;
  const [showAllTurns, setShowAllTurns] = useState(false);

  // Vào phiên sau một nhịp để StrictMode (mount, gỡ, mount lại) không bắt đầu rồi thoát ngay
  useEffect(() => {
    if (!autoStart) return;
    const timer = setTimeout(() => void controller.start(), 0);
    return () => clearTimeout(timer);
  }, [autoStart, controller]);

  const reported = useRef(false);
  useEffect(() => {
    const finished = phase === "ended" || (phase === "fallback" && state.outcome !== null);
    if (!finished || reported.current || !state.outcome) return;
    reported.current = true;
    onEnded?.({ outcome: state.outcome, words: state.words });
  }, [phase, state.outcome, state.words, onEnded]);

  // Giữ Space để đọc khi đang ở Lượt chấm
  useEffect(() => {
    if (phase !== "scoring") return;
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isInteractive(e.target)) return;
      e.preventDefault();
      controller.startHolding();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isInteractive(e.target)) return;
      e.preventDefault();
      void controller.stopHolding();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, controller]);

  const active = phase === "live" || phase === "scoring" || phase === "assessing";
  const scoring = phase === "scoring" || phase === "assessing";
  const nearEnd = limits !== null && state.elapsedSeconds >= limits.wrapUpAtSeconds;
  const turns = showAllTurns ? state.turns : state.turns.slice(-2);

  const leave = () => {
    // Thoát giữa chừng: effect trên không kịp chạy vì khung bị gỡ ngay, nên báo kết quả tại đây
    if (phase !== "idle" && !reported.current) {
      reported.current = true;
      onEnded?.({ outcome: state.outcome ?? (active ? "learner_exit" : "connect_failed"), words: state.words });
    }
    controller.leave();
    onClose();
  };

  return (
    <section aria-label={t(`${K}.title`)} className="flex flex-col gap-4 rounded-xl border border-primary/50 bg-surface p-4 md:p-5">
      <header className="flex items-center gap-3">
        <b className="font-display text-lg">{t(`${K}.title`)}</b>
        <span className="flex-1" />
        {active && limits && (
          <span
            title={t(`${K}.clockMax`, { max: formatClock(limits.maxSeconds) })}
            className={`rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
              nearEnd ? "bg-warning/15 text-warning" : "bg-surface-hover text-text-muted"
            }`}
          >
            <Icon name="timer" className="mr-1 align-[-2px]" />
            {formatClock(state.elapsedSeconds)}
          </span>
        )}
      </header>

      {phase === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 rounded-md bg-surface-hover px-3 py-2 text-sm text-text-muted">
            <Icon name="headphones" className="flex-none" />
            {t(`${K}.headset`)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void controller.start()}>{t(`${K}.start`)}</Button>
            <Button variant="ghost" onClick={leave}>
              {t(`${K}.later`)}
            </Button>
          </div>
        </div>
      )}

      {phase === "connecting" && (
        <div className="flex flex-col gap-3">
          <TutorStage controller={controller} mood="hello" caption={t(`${K}.connecting`)} />
          <p className="flex items-center gap-2 rounded-md bg-surface-hover px-3 py-2 text-sm text-text-muted">
            <Icon name="headphones" className="flex-none" />
            {t(`${K}.headset`)}
          </p>
        </div>
      )}

      {phase === "fallback" && (
        <TutorFallback
          code={state.fallbackCode}
          reason={state.fallbackReason}
          words={state.fallbackWords}
          isPro={isPro}
          onRetry={() => {
            reported.current = false; // phiên mới phải được báo lại khi kết thúc
            void controller.start();
          }}
          onUpgrade={onUpgrade}
        />
      )}

      {(active || phase === "ended") && (
        <WordChips
          sentence={sentence}
          words={state.words}
          currentWord={state.currentWord}
          disabled={phase === "ended" || phase === "assessing" || state.holding}
          maxAttempts={limits?.maxAttemptsPerWord ?? 3}
          onChoose={(word) => void controller.chooseWord(word)}
        />
      )}

      {phase === "live" && (
        <>
          <TutorStage
            controller={controller}
            mood={state.tutorSpeaking ? "speaking" : "listening"}
            caption={state.tutorSpeaking ? t(`${K}.speaking`) : t(`${K}.listening`)}
          />
          {turns.length > 0 && (
            <div className="flex flex-col gap-2">
              <ul className="m-0 flex max-h-64 list-none flex-col gap-2 overflow-y-auto p-0" aria-label={t(`${K}.turns`)}>
                {turns.map((turn) => (
                  <li key={turn.id} className={`flex ${turn.role === "learner" ? "justify-end" : ""}`}>
                    <span
                      className={`max-w-[86%] rounded-2xl px-3.5 py-2 leading-relaxed ${
                        turn.role === "learner"
                          ? "rounded-br-sm border border-border bg-surface-hover"
                          : "rounded-bl-sm bg-primary-soft"
                      }`}
                    >
                      {turn.text}
                    </span>
                  </li>
                ))}
              </ul>
              {state.turns.length > 2 && (
                <Button variant="text" size="sm" className="self-start" onClick={() => setShowAllTurns((v) => !v)}>
                  {showAllTurns ? t(`${K}.collapse`) : t(`${K}.showAll`)}
                </Button>
              )}
            </div>
          )}
          {state.offTopicStreak > 0 && limits && (
            <p role="alert" className="flex items-center gap-2 rounded-md border border-warning/45 bg-warning/15 px-3.5 py-2.5 text-sm">
              <Icon name="triangle-alert" className="flex-none text-warning" />
              {t(`${K}.offTopic`, { n: state.offTopicStreak, max: limits.offTopicEndStreak })}
            </p>
          )}
        </>
      )}

      {scoring && (
        <>
          <TutorStage controller={controller} mood="listening" dim />
          <TutorScoring state={state} controller={controller} sentence={sentence} />
        </>
      )}

      {state.notice && (
        <p role="status" className="rounded-md border border-warning/45 bg-warning/10 px-3.5 py-2.5 text-sm">
          {state.notice}
        </p>
      )}

      {phase === "ended" && state.outcome && <TutorResult outcome={state.outcome} words={state.words} />}

      <div className="flex flex-wrap items-center gap-2">
        {phase === "live" && (
          <>
            <Button fn="shadowing" variant="fn" size="sm" leftIcon={<Icon name="target" />} onClick={() => controller.startScoring("word")}>
              {state.currentWord ? t(`${K}.scoreWord`, { word: state.currentWord }) : t(`${K}.scoreCurrent`)}
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<Icon name="target" />} onClick={() => controller.startScoring("sentence")}>
              {t(`${K}.scoreSentence`)}
            </Button>
          </>
        )}
        <span className="flex-1" />
        {phase !== "idle" && (
          <Button variant={phase === "ended" || phase === "fallback" ? "primary" : "ghost"} size="sm" onClick={leave}>
            {t(`${K}.leave`)}
          </Button>
        )}
      </div>
    </section>
  );
}
