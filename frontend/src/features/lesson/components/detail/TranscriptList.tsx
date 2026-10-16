import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { formatTimeMs } from "@/lib/format";
import QueryError from "../QueryError";
import type { SentenceResponse } from "../../types";

const INITIAL_LIMIT = 8;
const STEP = 8;

function speak(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
}

export interface TranscriptListProps {
  sentences: SentenceResponse[];
  /** Bài Pro mà người dùng chưa có gói Pro. */
  locked: boolean;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
}

/** Danh sách câu của bài; transcript ẩn sẵn để không lộ đáp án khi nghe chép. */
export default function TranscriptList({ sentences, locked, loading, error, onRetry, retrying }: TranscriptListProps) {
  const { t } = useTranslation("pages");
  const p = "student.lessonDetail.transcript";
  const [revealed, setRevealed] = useState(false);
  const [visible, setVisible] = useState(INITIAL_LIMIT);

  const shown = sentences.slice(0, visible);
  const remaining = sentences.length - visible;

  const body = () => {
    if (locked) {
      return (
        <EmptyState
          title={t("student.lessonDetail.proRequiredTitle", "Bài học dành cho gói Pro")}
          description={t("student.lessonDetail.proRequiredDesc", "Nâng cấp lên gói Pro để xem transcript và luyện tập bài này.")}
        />
      );
    }
    if (error) return <QueryError error={error} onRetry={onRetry} retrying={retrying} />;
    if (loading) {
      return (
        <div className="flex flex-col gap-3 py-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      );
    }
    if (sentences.length === 0) {
      return <p className="py-4 text-center text-xs text-text-muted">{t(`${p}.empty`, "Chưa có dữ liệu câu cho bài này.")}</p>;
    }
    return (
      <>
        <div id="sentList" className={revealed ? "" : "pointer-events-none select-none blur-xs transition-[filter] duration-200"}>
          {shown.map((s, idx) => (
            <div key={s.id || idx} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-t border-border py-3 first:border-t-0">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 self-start place-items-center rounded-sm bg-surface-hover text-xs font-semibold text-text-muted">
                {idx + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium leading-snug text-text">{s.text}</span>
                {s.ipa && <span className="select-text font-mono text-[12px] tracking-wide text-text-muted">/{s.ipa.replace(/^\/|\/$/g, "")}/</span>}
              </div>
              <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 self-start whitespace-nowrap text-xs text-text-muted">
                <span>{formatTimeMs(s.startMs)}</span>
                <button
                  type="button"
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-border bg-primary-soft text-primary-text transition-colors duration-150 hover:bg-primary hover:text-white"
                  aria-label={t(`${p}.listen`, { index: idx + 1, defaultValue: `Nghe câu ${idx + 1}` })}
                  onClick={() => speak(s.text)}
                >
                  <Icon name="volume-2" />
                </button>
              </span>
            </div>
          ))}
        </div>

        {sentences.length > INITIAL_LIMIT && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs font-medium text-text-muted">
              {t(`${p}.showingCount`, { visible: shown.length, total: sentences.length, defaultValue: `Đang hiện ${shown.length}/${sentences.length} câu` })}
            </span>
            <div className="flex items-center gap-2">
              {remaining > 0 && (
                <Button variant="secondary" size="sm" leftIcon={<Icon name="chevron-down" />} onClick={() => setVisible((v) => v + STEP)}>
                  {t(`${p}.showMore`, { count: Math.min(STEP, remaining), defaultValue: `Xem thêm ${Math.min(STEP, remaining)} câu` })}
                </Button>
              )}
              {visible > INITIAL_LIMIT && (
                <Button variant="ghost" size="sm" leftIcon={<Icon name="chevron-up" />} onClick={() => setVisible(INITIAL_LIMIT)}>
                  {t(`${p}.collapse`, "Thu gọn")}
                </Button>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text">
          {t(`${p}.sentencesInLesson`, "Các câu trong bài")} <span className="text-xs font-normal text-text-muted">({sentences.length})</span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={revealed}
          onClick={() => setRevealed(!revealed)}
          leftIcon={<Icon name={revealed ? "eye-off" : "eye"} />}
        >
          {revealed ? t(`${p}.hide`, "Ẩn transcript") : t(`${p}.view`, "Hiện transcript")}
        </Button>
      </div>
      <p className="my-2 text-xs text-text-muted">{t(`${p}.note`, "Transcript ẩn sẵn để không lộ đáp án khi nghe chép.")}</p>
      {body()}
    </div>
  );
}
