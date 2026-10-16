import { useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
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

/** Màu điểm câu: ≥80 tốt, ≥60 trung bình, còn lại cần làm lại (`scoreTone` của mockup). */
const scoreVariant = (score: number) => (score >= 80 ? "success" : score >= 60 ? "warning" : "danger");

export interface TranscriptListProps {
  sentences: SentenceResponse[];
  /** Bài Pro mà người dùng chưa có gói Pro. */
  locked: boolean;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
  /** Đã học dở bài này: câu đầu tiên chưa có điểm được đánh dấu "Đang ở câu này". */
  started: boolean;
}

/** Danh sách câu của bài (`.sentlist`): số câu, điểm tốt nhất, mốc thời gian, nút nghe. Transcript ẩn (làm mờ) sẵn để không lộ đáp án khi nghe chép. */
export default function TranscriptList({ sentences, locked, loading, error, onRetry, retrying, started }: TranscriptListProps) {
  const { t } = useTranslation("pages");
  const p = "student.lessonDetail.transcript";
  const [revealed, setRevealed] = useState(false);
  const [visible, setVisible] = useState(INITIAL_LIMIT);

  const shown = sentences.slice(0, visible);
  const remaining = sentences.length - visible;
  const currentIndex = started ? sentences.findIndex((s) => s.myBestScore == null) : -1;

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
        <div className="flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      );
    }
    if (sentences.length === 0) {
      return <p className="py-4 text-center text-[13px] text-text-muted">{t(`${p}.empty`, "Chưa có dữ liệu câu cho bài này.")}</p>;
    }
    return (
      <>
        <div id="sentList">
          {shown.map((s, idx) => {
            const scored = s.myBestScore != null;
            return (
              <div key={s.id || idx} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-1 py-3.5 last:border-b-0">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    scored ? "bg-success/20 text-success" : "bg-border text-text-muted"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <span className={`font-semibold transition-[filter] duration-200 ${revealed ? "" : "select-none blur-[6px]"}`}>{s.text}</span>
                  {revealed && s.ipa && <div className="select-text text-[13px] text-text-subtle">/{s.ipa.replace(/^\/|\/$/g, "")}/</div>}
                </div>
                <span className="flex items-center gap-2 text-[13px] text-text-subtle">
                  {scored ? (
                    <Badge variant={scoreVariant(s.myBestScore!)}>{s.myBestScore}</Badge>
                  ) : idx === currentIndex ? (
                    <Badge variant="primary">{t(`${p}.current`, "Đang ở câu này")}</Badge>
                  ) : null}
                  {formatTimeMs(s.startMs)}
                  <Button
                    variant="ghost"
                    iconOnly
                    aria-label={t(`${p}.listen`, { index: idx + 1, defaultValue: `Nghe câu ${idx + 1}` })}
                    onClick={() => speak(s.text)}
                  >
                    <Icon name="volume-2" />
                  </Button>
                </span>
              </div>
            );
          })}
        </div>

        {sentences.length > INITIAL_LIMIT && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] text-text-muted">
              {t(`${p}.showingCount`, { visible: shown.length, total: sentences.length, defaultValue: `Đang hiện ${shown.length}/${sentences.length} câu` })}
            </span>
            <div className="flex items-center gap-2">
              {remaining > 0 && (
                <Button variant="ghost" size="sm" leftIcon={<Icon name="chevron-down" />} onClick={() => setVisible((v) => v + STEP)}>
                  {t(`${p}.showMore`, { count: Math.min(STEP, remaining), defaultValue: `Xem thêm ${Math.min(STEP, remaining)} câu` })}
                </Button>
              )}
              {visible > INITIAL_LIMIT && (
                <Button variant="text" size="sm" leftIcon={<Icon name="chevron-up" />} onClick={() => setVisible(INITIAL_LIMIT)}>
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
    <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold leading-[1.4]">
          {t(`${p}.sentencesInLesson`, "Các câu trong bài")} <span className="text-[13px] font-normal text-text-muted">({sentences.length})</span>
        </h3>
        <Button variant="ghost" size="sm" aria-pressed={revealed} onClick={() => setRevealed(!revealed)} leftIcon={<Icon name={revealed ? "eye-off" : "eye"} />}>
          {revealed ? t(`${p}.hide`, "Ẩn transcript") : t(`${p}.view`, "Hiện transcript")}
        </Button>
      </div>
      <p className="mb-4 mt-2 text-[13px] leading-normal text-text-muted">{t(`${p}.note`, "Transcript ẩn sẵn để không lộ đáp án khi nghe chép.")}</p>
      {body()}
    </div>
  );
}
