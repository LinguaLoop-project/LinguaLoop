import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Chip from "@/components/common/Chip";
import ProgressBar from "@/components/common/ProgressBar";
import type { DictationSentence } from "../types";
import { LEVEL_CHIP, SCORE_BADGE, scoreTone } from "../utils";

export interface SentenceListProps {
  sentences: DictationSentence[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

/** Danh sách câu bên phải (`renderList` của mockup): tiến độ, điểm từng câu, chữ gốc nếu đã làm. */
export default function SentenceList({ sentences, currentIndex, onSelect }: SentenceListProps) {
  const { t } = useTranslation("dictation");
  const total = sentences.length;
  const done = sentences.filter((s) => s.latest).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const currentRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  // Chỉ cuộn bên trong danh sách để câu hiện tại luôn thấy được; scrollIntoView sẽ cuộn cả trang.
  useEffect(() => {
    const box = listRef.current;
    const item = currentRef.current;
    if (!box || !item) return;
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
  }, [currentIndex]);

  return (
    <aside
      aria-label={t("list.aria")}
      className="flex max-h-[calc(100vh-110px)] min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] min-[1100px]:sticky min-[1100px]:top-20 max-[1099px]:max-h-none"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-text-muted">{t("list.title")}</div>
        <Chip className="pointer-events-none">
          {done}/{total} · {percent}%
        </Chip>
      </div>
      <ProgressBar value={percent} tone="dictation" label={t("list.title")} thin />
      <ol ref={listRef} className="relative -mr-1 flex min-h-[120px] flex-col gap-2 overflow-y-auto pr-1 max-[1099px]:max-h-[360px]">
        {sentences.map((s, i) => {
          const current = i === currentIndex;
          const tone = s.latest ? scoreTone(s.latest.score) : null;
          return (
            <li key={s.id}>
              <button
                ref={current ? currentRef : undefined}
                type="button"
                aria-current={current ? "true" : undefined}
                onClick={() => onSelect(i)}
                className={`flex w-full flex-none flex-col gap-1.5 rounded-md border p-2.5 text-left transition-colors duration-150 ${
                  current
                    ? "border-2 border-fn-dictation bg-fn-dictation-soft p-[9px]"
                    : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
                }`}
              >
                <span className="flex min-h-[22px] items-center gap-2">
                  <span className="rounded-[6px] border border-border bg-bg-elevated px-2 py-0.5 text-xs font-bold">#{i + 1}</span>
                  {s.latest && tone ? (
                    <>
                      <Badge tone={SCORE_BADGE[tone]}>{Math.round(s.latest.score)}</Badge>
                      <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] ${LEVEL_CHIP[s.latest.level]}`}>
                        {t(`level.${s.latest.level}`)}
                      </span>
                    </>
                  ) : (
                    current && <span className="text-[13px] font-semibold text-fn-dictation">{t("list.doing")}</span>
                  )}
                </span>
                {s.text ? (
                  <span className="break-words text-[13px] leading-normal text-text">{s.text}</span>
                ) : (
                  <span
                    role="img"
                    aria-label={t("list.words", { count: s.wordCount })}
                    className="break-words text-[13px] leading-normal tracking-[0.2em] text-text-muted"
                  >
                    {Array.from({ length: s.wordCount }, () => "●").join(" ")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
