import { useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { WordSourceProvider } from "@/features/dictionary";
import { useAttemptHistory, useHistoryAttempt } from "../hooks/useShadowing";
import { TONE_TEXT, toneOf } from "../utils";
import SentenceWords from "./SentenceWords";

const K = "student.shadowingPractice";

const METRICS = ["accuracy", "fluency", "completeness", "prosody"] as const;

export interface HistoryPanelProps {
  sentenceId: string;
  sentenceText: string;
}

/**
 * Mọi lượt đọc của câu, mới nhất trước. Bấm một lượt để xem lại từ tô màu và Nhận xét AI đã lưu của lượt đó; bản ghi âm
 * không được lưu nên không nghe lại được (BR-SHADOW-07).
 */
export default function HistoryPanel({ sentenceId, sentenceText }: HistoryPanelProps) {
  const { t, i18n } = useTranslation("pages");
  const history = useAttemptHistory(sentenceId, true);
  const [selected, setSelected] = useState<number | null>(null);
  const detail = useHistoryAttempt(selected);
  const attempts = history.data ?? [];
  const when = new Intl.DateTimeFormat(i18n.language, { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-bg-elevated p-3">
      <div className="text-xs font-bold uppercase tracking-wider text-text-muted">{t(`${K}.history.title`)}</div>
      {history.isLoading && (
        <p role="status" className="text-sm text-text-muted">
          {t(`${K}.history.loading`)}
        </p>
      )}
      {history.isError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          {t(`${K}.history.failed`)}
          <Button variant="text" size="sm" onClick={() => void history.refetch()}>
            {t(`${K}.history.retry`)}
          </Button>
        </p>
      )}
      {history.isSuccess && attempts.length === 0 && (
        <p className="text-sm text-text-muted">{t(`${K}.history.empty`)}</p>
      )}
      <ol className="flex max-h-[240px] flex-col gap-1.5 overflow-y-auto">
        {attempts.map((attempt) => {
          const tone = toneOf(attempt.score);
          const on = selected === attempt.attemptId;
          return (
            <li key={attempt.attemptId}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(on ? null : attempt.attemptId)}
                className={`flex w-full flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors duration-150 ${
                  on
                    ? "border-fn-shadowing bg-fn-shadowing-soft"
                    : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
                }`}
              >
                <Badge tone={tone === "good" ? "success" : tone === "mid" ? "warning" : "danger"}>
                  {Math.round(attempt.score)}
                </Badge>
                {METRICS.map((key) => {
                  const value = attempt[key];
                  return value === null ? null : (
                    <span key={key} className="text-xs text-text-muted">
                      {t(`${K}.metrics.${key}`)}{" "}
                      <b className={`tabular-nums ${TONE_TEXT[toneOf(value)]}`}>{Math.round(value)}</b>
                    </span>
                  );
                })}
                <span className="grow" />
                <time dateTime={attempt.attemptedAt} className="text-xs text-text-muted">
                  {when.format(new Date(attempt.attemptedAt))}
                </time>
              </button>
            </li>
          );
        })}
      </ol>
      {selected !== null && detail.isError && (
        <p role="alert" className="text-sm text-danger">
          {t(`${K}.history.detailFailed`)}
        </p>
      )}
      {selected !== null && detail.data && (
        <div className="flex flex-col gap-2 border-t border-border pt-2">
          <WordSourceProvider sentenceId={sentenceId}>
            <SentenceWords
              text={sentenceText}
              words={detail.data.words}
              ipa={null}
              lit={-1}
              selected={null}
              onSelect={() => undefined}
            />
          </WordSourceProvider>
          {detail.data.aiFeedback && (
            <p className="whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-sm">
              {detail.data.aiFeedback.content}
            </p>
          )}
          <p className="text-xs text-text-muted">{t(`${K}.history.noAudio`)}</p>
        </div>
      )}
    </div>
  );
}
