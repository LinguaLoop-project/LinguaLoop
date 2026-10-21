import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import type { MascotMood } from "@/components/common/Mascot";
import type { SessionOutcome, WordView } from "../types";
import { outcomeTone, practiced } from "../utils";

const K = "student.tutor.result";

const TONE_BOX = {
  ok: "border-success",
  warn: "border-warning",
  bad: "border-danger",
  neutral: "border-border-strong",
} as const;

const TONE_MOOD: Record<keyof typeof TONE_BOX, MascotMood> = {
  ok: "correct",
  warn: "encourage",
  bad: "encourage",
  neutral: "hello",
};

export interface TutorResultProps {
  outcome: SessionOutcome;
  words: WordView[];
}

/** Kết quả phiên: lý do kết thúc và điểm trước → sau của từng từ đã luyện. Điểm của Lượt shadowing gốc không đổi. */
export default function TutorResult({ outcome, words }: TutorResultProps) {
  const { t } = useTranslation("pages");
  const tone = outcomeTone(outcome);
  const done = practiced(words);

  return (
    <div className={`flex flex-col gap-3 rounded-xl border bg-surface-hover p-4 ${TONE_BOX[tone]}`}>
      <div className="flex items-center gap-3">
        <Mascot mood={TONE_MOOD[tone]} size={64} alt="" className="hidden sm:block" />
        <div>
          <b className="font-display text-lg">{t(`${K}.title`)}</b>
          <p className="text-sm text-text-muted">{t(`${K}.outcome.${outcome}`)}</p>
        </div>
      </div>
      {done.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {done.map((w) => (
            <li key={w.word} className="flex items-center gap-2.5 rounded-md bg-bg-elevated px-3 py-2">
              <b>{w.word}</b>
              {w.phoneme && <span className="text-sm text-text-muted">/{w.phoneme}/</span>}
              <span className="ml-auto font-bold tabular-nums">
                {Math.round(w.baseline)} → {w.best !== undefined ? Math.round(w.best) : "—"}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-sm ${
                  w.status === "passed" ? "text-success" : w.status === "needs_practice" ? "text-warning" : "text-text-muted"
                }`}
              >
                {w.status === "passed" && <Icon name="check" />}
                {w.status === "needs_practice" && <Icon name="rotate-cw" />}
                {t(`${K}.status.${w.status}`)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">{t(`${K}.none`)}</p>
      )}
    </div>
  );
}
