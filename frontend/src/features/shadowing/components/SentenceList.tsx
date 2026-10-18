import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import ProgressBar from "@/components/common/ProgressBar";
import type { SentenceResponse } from "@/features/lesson/types";
import type { SentenceRecord } from "../types";
import { maskText, toneOf, weakPhonemes } from "../utils";

const K = "student.shadowingPractice";

export interface SentenceListProps {
  sentences: SentenceResponse[];
  records: Record<string, SentenceRecord>;
  current: number;
  disabled: boolean;
  /** Tab Xem hiện chữ của mọi câu; tab Luyện che các câu chưa đọc. */
  revealAll: boolean;
  showVi: boolean;
  onGo: (index: number) => void;
}

/** Bản chép các câu (`dc-list`): tiến độ cả bài, từng câu kèm điểm cao nhất, số lần đọc và âm hay sai. */
export default function SentenceList({ sentences, records, current, disabled, revealAll, showVi, onGo }: SentenceListProps) {
  const { t } = useTranslation("pages");
  const listRef = useRef<HTMLOListElement>(null);

  const done = sentences.filter((s) => records[s.id]).length;
  const pct = Math.round((done / Math.max(1, sentences.length)) * 100);
  const weak = weakPhonemes(records);

  // Câu đang luyện hoặc đang phát (tab Xem) luôn nằm trong khung nhìn
  useEffect(() => {
    listRef.current?.querySelector("[aria-current=true]")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current]);

  return (
    <aside
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] min-[1100px]:sticky min-[1100px]:top-20 min-[1100px]:max-h-[calc(100vh-110px)]"
      aria-label={t(`${K}.list.title`)}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-fn-shadowing">{t(`${K}.list.title`)}</h2>
        <span className="inline-flex h-8 items-center rounded-full border border-border-strong px-3 text-sm font-semibold tabular-nums">
          {t(`${K}.list.progress`, { done, total: sentences.length, pct })}
        </span>
      </div>
      <ProgressBar value={pct} tone="shadowing" label={t(`${K}.list.title`)} thin />

      <ol ref={listRef} className="-mr-1 flex min-h-32 flex-col gap-2 overflow-y-auto pr-1 max-[1099px]:max-h-96">
        {sentences.map((s, i) => {
          const rec = records[s.id];
          const isCurrent = i === current;
          const tone = rec ? toneOf(rec.best) : null;
          const show = revealAll || !!rec;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={disabled}
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onGo(i)}
                className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-md text-left transition-colors hover:border-border-strong hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60 ${
                  isCurrent
                    ? "border-2 border-fn-shadowing bg-fn-shadowing-soft p-[9px_11px]"
                    : "border border-border bg-surface p-[10px_12px]"
                }`}
              >
                <span className="flex min-h-[22px] flex-wrap items-center gap-2">
                  <span className="rounded-md border border-border bg-bg-elevated px-2 py-0.5 text-xs font-bold tabular-nums">
                    #{i + 1}
                  </span>
                  {rec && tone ? (
                    <>
                      <Badge tone={tone === "good" ? "success" : tone === "mid" ? "warning" : "danger"}>
                        {Math.round(rec.best)}
                      </Badge>
                      <span className="rounded-full border border-border-strong px-2 text-[11px] leading-5">
                        {t(`${K}.times`, { count: rec.count })}
                      </span>
                      {rec.best >= 80 && <Icon name="circle-check" className="text-success" />}
                    </>
                  ) : (
                    isCurrent && (
                      <span className="text-xs font-semibold text-fn-shadowing">
                        {revealAll ? t(`${K}.watching`) : t(`${K}.current`)}
                      </span>
                    )
                  )}
                </span>
                <span className={`break-words text-[13px] leading-normal ${show ? "text-text" : "tracking-wide text-text-muted"}`}>
                  {show ? s.text : maskText(s.text)}
                </span>
                {showVi && show && s.textVi && <span className="text-xs italic text-text-subtle">{s.textVi}</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {weak.length > 0 && (
        <p className="border-t border-border pt-2 text-xs text-text-muted">
          {t(`${K}.list.weak`)} <b className="text-danger">{weak.map((symbol) => `/${symbol}/`).join(" · ")}</b>
        </p>
      )}
    </aside>
  );
}
