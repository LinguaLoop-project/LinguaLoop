import { useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import { useAttemptHistory, useHistoryAttempt } from "../hooks";
import { LEVEL_CHIP, resultContext, SCORE_BADGE, scoreTone } from "../utils";
import ResultDiff from "./ResultDiff";

export interface HistoryPanelProps {
  sentenceId: string;
  showTranslation: boolean;
}

/** Mọi lượt làm của câu, mới nhất trước; bấm một lượt để xem kết quả tô màu từng từ của lượt đó. */
export default function HistoryPanel({ sentenceId, showTranslation }: HistoryPanelProps) {
  const { t, i18n } = useTranslation("dictation");
  const history = useAttemptHistory(sentenceId, true);
  const [selected, setSelected] = useState<number | null>(null);
  const detail = useHistoryAttempt(sentenceId, selected);
  const attempts = history.data ?? [];
  const when = new Intl.DateTimeFormat(i18n.language, { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-bg-elevated p-3">
      <div className="text-xs font-bold uppercase tracking-wider text-text-muted">{t("history.title")}</div>
      {history.isLoading && <p role="status" className="text-sm text-text-muted">{t("history.loading")}</p>}
      {history.isError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          {t("history.failed")}
          <Button variant="text" size="sm" onClick={() => void history.refetch()}>
            {t("state.retry")}
          </Button>
        </p>
      )}
      {history.isSuccess && attempts.length === 0 && <p className="text-sm text-text-muted">{t("history.empty")}</p>}
      <ol className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto">
        {attempts.map((attempt) => (
          <li key={attempt.attemptId}>
            <button
              type="button"
              aria-pressed={selected === attempt.attemptId}
              onClick={() => setSelected(selected === attempt.attemptId ? null : attempt.attemptId)}
              className={`flex w-full flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors duration-150 ${
                selected === attempt.attemptId
                  ? "border-fn-dictation bg-fn-dictation-soft"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
              }`}
            >
              <Badge tone={SCORE_BADGE[scoreTone(attempt.score)]}>{Math.round(attempt.score)}</Badge>
              <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] ${LEVEL_CHIP[attempt.level]}`}>
                {t(`level.${attempt.level}`)}
              </span>
              {attempt.retry && <span className="text-xs text-text-muted">{t("history.retry")}</span>}
              {attempt.gaveUp && <span className="text-xs text-warning">{t("history.gaveUp")}</span>}
              <span className="grow" />
              <time dateTime={attempt.attemptedAt} className="text-xs text-text-muted">
                {when.format(new Date(attempt.attemptedAt))}
              </time>
            </button>
          </li>
        ))}
      </ol>
      {selected !== null && detail.isError && (
        <p role="alert" className="text-sm text-danger">{t("history.detailFailed")}</p>
      )}
      {selected !== null && detail.data && (
        <ResultDiff
          score={detail.data.score}
          level={detail.data.level}
          words={detail.data.words}
          context={resultContext(detail.data)}
          gaveUp={detail.data.gaveUp}
          detailLoading={false}
          text={detail.data.text}
          textVi={detail.data.textVi}
          showTranslation={showTranslation}
        />
      )}
    </div>
  );
}
