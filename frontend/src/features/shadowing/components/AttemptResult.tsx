import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import type { SentenceRecord } from "../types";
import { TONE_TEXT, toneOf } from "../utils";

const K = "student.shadowingPractice";

type PillTone = "neutral" | "bad" | "warn" | "ok";

const PILL_TONE: Record<PillTone, string> = {
  neutral: "border-border-strong text-text",
  bad: "border-danger/40 bg-danger/10 text-danger",
  warn: "border-warning/40 bg-warning/10 text-warning",
  ok: "border-success/40 bg-success/10 text-success",
};

function Pill({ tone = "neutral", children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium ${PILL_TONE[tone]}`}>
      {children}
    </span>
  );
}

export interface AttemptResultProps {
  record: SentenceRecord;
  /** Đây là câu cuối và mọi câu đã có điểm: nút chuyển thành "Hoàn thành". */
  isFinish: boolean;
  onListen: () => void;
  onNext: () => void;
  /** Nút thêm cạnh "Nghe mẫu" (vd "Hỏi gia sư"). */
  extraActions?: ReactNode;
}

/** Kết quả gọn sau một Lượt shadowing (`sh-res`): điểm, các chip tóm tắt lỗi, lời nhắn, nghe mẫu và câu tiếp. */
export default function AttemptResult({ record, isFinish, onListen, onNext, extraActions }: AttemptResultProps) {
  const { t } = useTranslation("pages");
  const tone = toneOf(record.score);

  const omitted = record.words.filter((w) => w.outcome === "omitted").length;
  const inserted = record.words.filter((w) => w.outcome === "inserted").length;
  const hasPhonemes = record.words.some((w) => w.phonemes.length > 0);
  const badPhonemes = new Map<string, number>();
  for (const w of record.words) {
    for (const p of w.phonemes) {
      if (p.needsFix) {
        const key = p.expected ?? p.symbol;
        badPhonemes.set(key, (badPhonemes.get(key) ?? 0) + 1);
      }
    }
  }
  const phonemeChips = [...badPhonemes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const noIssues = hasPhonemes && omitted === 0 && inserted === 0 && phonemeChips.length === 0;

  const metrics = [
    ["accuracy", record.accuracy],
    ["fluency", record.fluency],
    ["completeness", record.completeness],
    ["prosody", record.prosody],
  ] as const;

  return (
    <section aria-live="polite" className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-full shrink-0 rounded-lg bg-surface-hover py-2.5 text-center sm:w-[88px]">
          <b className={`block font-display text-4xl font-extrabold leading-tight tabular-nums ${TONE_TEXT[tone]}`}>
            {Math.round(record.score)}
          </b>
          <span className="text-xs text-text-muted">{t(`${K}.score`)}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Pill>{t(`${K}.result.best`, { best: Math.round(record.best) })}</Pill>
            <Pill>{t(`${K}.readCount`, { count: record.count })}</Pill>
            {metrics.map(([key, value]) =>
              value === null ? null : (
                <Pill key={key}>
                  {t(`${K}.metrics.${key}`)} <b className={`tabular-nums ${TONE_TEXT[toneOf(value)]}`}>{Math.round(value)}</b>
                </Pill>
              ),
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {omitted > 0 && <Pill tone="bad">{t(`${K}.result.omitted`, { n: omitted })}</Pill>}
            {inserted > 0 && <Pill tone="warn">{t(`${K}.result.inserted`, { n: inserted })}</Pill>}
            {phonemeChips.map(([symbol, n]) => (
              <Pill key={symbol} tone="bad">
                {t(`${K}.result.badPhoneme`, { symbol, n })}
              </Pill>
            ))}
            {noIssues && (
              <Pill tone="ok">
                <Icon name="circle-check" />
                {t(`${K}.result.noIssues`)}
              </Pill>
            )}
          </div>
          <p className="text-sm text-text-muted">{t(`${K}.word.clickHint`)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Mascot mood={tone === "good" ? "correct" : "encourage"} size={48} alt="" />
        <p className="text-sm font-medium">{t(`${K}.verdict.${tone}`)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onListen} leftIcon={<Icon name="volume-2" />}>
          {t(`${K}.listen`)}
        </Button>
        {extraActions}
        <span className="flex-1" />
        <Button onClick={onNext} rightIcon={<Icon name={isFinish ? "check" : "arrow-right"} />}>
          {isFinish ? t(`${K}.result.finish`) : t(`${K}.next`)}
        </Button>
      </div>
    </section>
  );
}
