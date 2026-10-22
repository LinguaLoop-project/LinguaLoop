import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { TutorSessionController, TutorState } from "../controller";
import HoldToTalkButton from "./HoldToTalkButton";

const K = "student.tutor.scoring";

export interface TutorScoringProps {
  state: TutorState;
  controller: TutorSessionController;
  sentence: string;
}

/** Lượt chấm: màu Shadowing, gia sư tạm không nghe; người học giữ nút để đọc rồi thả để Azure chấm. */
export default function TutorScoring({ state, controller, sentence }: TutorScoringProps) {
  const { t } = useTranslation("pages");
  const { phase, holding, scoringTarget, scoringWord, words, currentWord, limits } = state;
  const isSentence = scoringTarget === "sentence";
  const target = isSentence ? sentence : scoringWord;
  const current = words.find((w) => w.word === currentWord);
  const max = limits?.maxAttemptsPerWord ?? 3;
  const attemptNumber = current ? Math.min(current.attempts + 1, max) : 1;

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-xl border-2 border-fn-shadowing bg-fn-shadowing-soft p-4 text-center"
    >
      <div className="flex items-center gap-2 font-semibold">
        <Icon name="target" className="text-fn-shadowing" />
        {t(`${K}.title`)}
      </div>
      {target && (
        <>
          <p className="text-sm text-text-muted">
            {isSentence ? t(`${K}.readSentence`) : t(`${K}.readWord`, { n: attemptNumber, max })}
          </p>
          <p className="font-display text-3xl font-extrabold leading-tight tracking-tight">{target}</p>
        </>
      )}
      {phase === "assessing" ? (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Icon name="loader-circle" className="animate-spin" />
          {t(`${K}.assessing`)}
        </p>
      ) : (
        <>
          <HoldToTalkButton holding={holding} onStart={() => controller.startHolding()} onStop={() => void controller.stopHolding()} />
          <p className="text-sm text-text-muted">{holding ? t(`${K}.holding`) : `${t(`${K}.hold`)} · ${t(`${K}.orSpace`)}`}</p>
          {!holding && (
            <Button variant="text" size="sm" onClick={() => controller.cancelScoring()}>
              {t(`${K}.cancel`)}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
