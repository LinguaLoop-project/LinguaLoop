import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import SegmentedControl from "@/components/common/SegmentedControl";
import Skeleton from "@/components/common/Skeleton";
import { ClickableText, WordSourceProvider } from "@/features/dictionary";
import { formatTimeMs } from "@/lib/format";
import QueryError from "../QueryError";
import type { SentenceResponse } from "../../types";

const INITIAL_LIMIT = 10;
const STEP = 10;

type SentenceFilter = "all" | "done" | "todo";

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

const MODES = ["dictation", "shadowing"] as const;

const hasScore = (s: SentenceResponse) => MODES.some((m) => s.myBestScore[m] != null);

export interface TranscriptListProps {
  lessonId?: string;
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

/** Danh sách câu của bài (`.sentlist`): số câu, điểm tốt nhất của từng chế độ, mốc thời gian, nút nghe và nhảy vào luyện câu. */
export default function TranscriptList({
  lessonId,
  sentences,
  locked,
  loading,
  error,
  onRetry,
  retrying,
  started,
}: TranscriptListProps) {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const p = "student.lessonDetail.transcript";
  const [revealed, setRevealed] = useState(false);
  const [peekedIds, setPeekedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SentenceFilter>("all");
  const [visible, setVisible] = useState(INITIAL_LIMIT);

  const indexedSentences = useMemo(
    () => sentences.map((s, idx) => ({ s, idx, scored: hasScore(s) })),
    [sentences],
  );

  const filteredSentences = useMemo(() => {
    const q = search.trim().toLowerCase();
    return indexedSentences.filter(({ s, scored }) => {
      if (filter === "done" && !scored) return false;
      if (filter === "todo" && scored) return false;
      if (!q) return true;
      return `${s.textEn} ${s.textVi ?? ""}`.toLowerCase().includes(q);
    });
  }, [filter, indexedSentences, search]);

  const shown = filteredSentences.slice(0, visible);
  const remaining = filteredSentences.length - visible;
  const currentIndex = started ? sentences.findIndex((s) => !hasScore(s)) : -1;
  const hasAnyScored = indexedSentences.some((x) => x.scored);

  const togglePeek = (id: string) => {
    setPeekedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

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
            <Skeleton key={i} className="h-11 w-full rounded-md" />
          ))}
        </div>
      );
    }
    if (sentences.length === 0) {
      return <p className="py-4 text-center text-[13px] text-text-muted">{t(`${p}.empty`, "Chưa có dữ liệu câu cho bài này.")}</p>;
    }
    return (
      <>
        {(sentences.length > 6 || hasAnyScored) && (
          <div className="mb-3 flex flex-col flex-wrap items-stretch gap-2.5 sm:flex-row sm:items-center">
            {revealed && (
              <SearchInput
                className="w-full min-w-[200px] sm:flex-1"
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setVisible(INITIAL_LIMIT);
                }}
                placeholder={t(`${p}.searchPlaceholder`, "Tìm câu trong bài…")}
                ariaLabel={t(`${p}.searchPlaceholder`, "Tìm câu trong bài…")}
              />
            )}
            {hasAnyScored && (
              <SegmentedControl
                ariaLabel={t(`${p}.sentencesInLesson`, "Các câu trong bài")}
                value={filter}
                onChange={(v) => {
                  setFilter(v as SentenceFilter);
                  setVisible(INITIAL_LIMIT);
                }}
                options={[
                  { value: "all", label: `${t(`${p}.filterAll`, "Tất cả")} (${sentences.length})` },
                  {
                    value: "done",
                    label: `${t(`${p}.filterDone`, "Đã luyện")} (${indexedSentences.filter((x) => x.scored).length})`,
                  },
                  {
                    value: "todo",
                    label: `${t(`${p}.filterTodo`, "Chưa luyện")} (${indexedSentences.filter((x) => !x.scored).length})`,
                  },
                ]}
              />
            )}
          </div>
        )}

        <div id="sentList" className="divide-y divide-border">
          {shown.map(({ s, idx, scored }) => {
            const isShown = revealed || peekedIds.has(s.id);
            const isCurrent = !scored && idx === currentIndex;
            return (
              <div
                key={s.id || idx}
                className={`group/row grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-3 rounded-md px-2 py-3.5 transition-colors hover:bg-surface-hover/50 ${
                  isCurrent ? "bg-primary-soft/25" : ""
                }`}
              >
                <span
                  className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full text-xs font-bold tabular-nums ${
                    scored
                      ? "bg-success/20 text-success"
                      : isCurrent
                        ? "bg-primary text-white"
                        : "bg-bg-elevated text-text-muted"
                  }`}
                >
                  {idx + 1}
                </span>

                <div
                  onClick={() => {
                    if (!revealed) togglePeek(s.id);
                  }}
                  title={!isShown ? t(`${p}.clickToPeek`, "Bấm vào câu để xem lẻ câu đó") : undefined}
                  className={`min-w-0 ${!revealed ? "cursor-pointer" : ""}`}
                >
                  <div
                    className={`font-semibold leading-snug transition-[filter] duration-200 ${
                      isShown ? "" : "select-none blur-[6px] hover:blur-[4px]"
                    }`}
                  >
                    {isShown ? (
                      <WordSourceProvider sentenceId={s.id}>
                        <ClickableText text={s.textEn} />
                      </WordSourceProvider>
                    ) : (
                      s.textEn
                    )}
                  </div>
                  {isShown && s.ipaUs && (
                    <div className="mt-0.5 select-text text-[13px] text-text-subtle">
                      /{s.ipaUs.replace(/^\/|\/$/g, "")}/
                    </div>
                  )}
                  {isShown && s.textVi && (
                    <div className="mt-1 text-[13px] text-text-muted">{s.textVi}</div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5 text-[13px] text-text-subtle">
                  {scored ? (
                    MODES.map((m) => {
                      const score = s.myBestScore[m];
                      return score == null ? null : (
                        <Badge key={m} variant={scoreVariant(score)}>
                          {t(`${p}.score_${m}`)} {score}
                        </Badge>
                      );
                    })
                  ) : isCurrent ? (
                    <Badge variant="primary">{t(`${p}.current`, "Đang ở câu này")}</Badge>
                  ) : null}

                  <span className="px-1 tabular-nums">{formatTimeMs(s.startMs)}</span>

                  {lessonId && (
                    <div className="hidden items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 sm:flex">
                      <button
                        type="button"
                        aria-label={t(`${p}.practiceDictation`, { index: idx + 1, defaultValue: `Nghe chép câu ${idx + 1}` })}
                        title={t(`${p}.practiceDictation`, { index: idx + 1, defaultValue: `Nghe chép câu ${idx + 1}` })}
                        onClick={() => navigate(`/student/dictation/${lessonId}?sentence=${encodeURIComponent(s.id)}`)}
                        className="grid size-8 cursor-pointer place-items-center rounded-md border border-fn-dictation/30 bg-fn-dictation-soft text-fn-dictation transition-colors hover:bg-fn-dictation hover:text-white"
                      >
                        <Icon name="headphones" className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t(`${p}.practiceShadowing`, { index: idx + 1, defaultValue: `Shadowing câu ${idx + 1}` })}
                        title={t(`${p}.practiceShadowing`, { index: idx + 1, defaultValue: `Shadowing câu ${idx + 1}` })}
                        onClick={() => navigate(`/student/shadowing/${lessonId}?sentence=${encodeURIComponent(s.id)}`)}
                        className="grid size-8 cursor-pointer place-items-center rounded-md border border-fn-shadowing/30 bg-fn-shadowing-soft text-fn-shadowing transition-colors hover:bg-fn-shadowing hover:text-white"
                      >
                        <Icon name="mic" className="size-3.5" />
                      </button>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={t(`${p}.listen`, { index: idx + 1, defaultValue: `Nghe câu ${idx + 1}` })}
                    title={t(`${p}.listen`, { index: idx + 1, defaultValue: `Nghe câu ${idx + 1}` })}
                    onClick={() => speak(s.textEn)}
                  >
                    <Icon name="volume-2" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSentences.length > INITIAL_LIMIT && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-[13px] tabular-nums text-text-muted">
              {t(`${p}.showingCount`, { visible: shown.length, total: filteredSentences.length, defaultValue: `Đang hiện ${shown.length}/${filteredSentences.length} câu` })}
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
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={revealed}
          onClick={() => {
            setRevealed(!revealed);
            setPeekedIds(new Set());
          }}
          leftIcon={<Icon name={revealed ? "eye-off" : "eye"} />}
        >
          {revealed ? t(`${p}.hide`, "Ẩn transcript") : t(`${p}.view`, "Hiện transcript")}
        </Button>
      </div>
      <p className="mb-4 mt-1.5 text-[13px] leading-normal text-text-muted">
        {t(`${p}.note`, "Transcript ẩn sẵn để không lộ đáp án khi nghe chép.")}
      </p>
      {body()}
    </div>
  );
}
