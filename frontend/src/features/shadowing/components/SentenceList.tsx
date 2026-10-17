import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import type { SentenceResponse } from "@/features/lesson/types";
import type { SentenceRecord } from "../types";
import { toneOf } from "../utils";

export interface SentenceListProps {
  sentences: SentenceResponse[];
  records: Record<string, SentenceRecord>;
  current: number;
  disabled: boolean;
  onGo: (index: number) => void;
}

/** Danh sách câu của bài kèm điểm cao nhất và số lần đã đọc (`dc-list` của mockup). */
export default function SentenceList({ sentences, records, current, disabled, onGo }: SentenceListProps) {
  const { t } = useTranslation("pages");
  const k = "student.shadowingPractice";

  return (
    <aside className="flex max-h-[640px] flex-col rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]" aria-label={t(`${k}.listTitle`)}>
      <h2 className="border-b border-border px-5 py-4 font-display text-base font-bold">{t(`${k}.listTitle`)}</h2>
      <ol className="min-h-0 flex-1 overflow-y-auto p-2">
        {sentences.map((s, i) => {
          const rec = records[s.id];
          const isCurrent = i === current;
          const tone = rec ? toneOf(rec.best) : null;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={disabled}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onGo(i)}
                className={`flex w-full cursor-pointer items-start gap-3 rounded-md border-0 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60 ${
                  isCurrent ? "bg-primary-soft" : "bg-transparent"
                }`}
              >
                <span className="mt-0.5 w-7 shrink-0 text-xs font-semibold tabular-nums text-text-subtle">#{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm text-text">{s.text}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    {rec && tone ? (
                      <>
                        <Badge tone={tone === "good" ? "success" : tone === "mid" ? "warning" : "danger"}>
                          {Math.round(rec.best)}
                        </Badge>
                        <span className="text-xs text-text-muted">{t(`${k}.times`, { count: rec.count })}</span>
                        {rec.best >= 80 && <Icon name="circle-check" className="text-success" />}
                      </>
                    ) : (
                      isCurrent && <span className="text-xs text-primary-text">{t(`${k}.current`)}</span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
