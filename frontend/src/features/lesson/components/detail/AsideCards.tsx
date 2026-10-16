import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { formatDuration } from "@/lib/format";
import type { LessonSummary, ModeProgress } from "../../types";

function AsideCard({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-text">{title}</div>
        {aside}
      </div>
      {children}
    </div>
  );
}

const pct = (n: number) => (n > 0 ? `${Math.round(n)}%` : "—");

/** Tiến độ tổng (trung bình hai chế độ) và từng chế độ. */
export function ProgressCard({ progress }: { progress: ModeProgress }) {
  const { t } = useTranslation("pages");
  const overall = Math.round((progress.dictationPercent + progress.shadowingPercent) / 2);
  const row = "flex items-center justify-between";
  return (
    <AsideCard title={t("student.lessonDetail.aside.progress", "Tiến độ của bạn")}>
      <div className="flex items-center gap-5">
        <div className="flex h-[88px] w-[88px] shrink-0 flex-col items-center justify-center rounded-full border-4 border-border">
          <span className="font-display text-2xl font-bold text-text">{overall}</span>
          <small className="text-[11px] text-text-muted">%</small>
        </div>
        <div className="flex flex-1 flex-col gap-2 text-xs">
          <div className={row}>
            <span className="flex items-center gap-2 text-text-muted">
              <Icon name="headphones" className="text-fn-dictation" />
              {t("student.lessonDetail.dictation.title", "Nghe chép")}
            </span>
            <b className="text-text">{pct(progress.dictationPercent)}</b>
          </div>
          <div className={row}>
            <span className="flex items-center gap-2 text-text-muted">
              <Icon name="mic" className="text-fn-shadowing" />
              {t("student.lessonDetail.shadowing.title", "Shadowing")}
            </span>
            <b className="text-text">{pct(progress.shadowingPercent)}</b>
          </div>
        </div>
      </div>
    </AsideCard>
  );
}

// TODO: thay bằng từ vựng thật của bài khi backend có API (hiện là dữ liệu mẫu).
const SAMPLE_WORDS = [
  { word: "reliable", cefr: "B1", meaning: "đáng tin cậy" },
  { word: "although", cefr: "B1", meaning: "mặc dù" },
  { word: "conversation", cefr: "A2", meaning: "cuộc trò chuyện" },
];

function speak(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
}

export function VocabCard() {
  const { t } = useTranslation("pages");
  return (
    <AsideCard
      title={t("student.lessonDetail.aside.vocab", "Từ vựng trong bài")}
      aside={<Button variant="text" size="sm">{t("student.lessonDetail.aside.saveAll", "Lưu tất cả")}</Button>}
    >
      {SAMPLE_WORDS.map((w) => (
        <div key={w.word} className="flex items-center justify-between gap-3 border-t border-border py-2 first:border-t-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-border bg-primary-soft text-primary-text transition-colors hover:bg-primary hover:text-white"
              aria-label={`Nghe ${w.word}`}
              onClick={() => speak(w.word)}
            >
              <Icon name="volume-2" />
            </button>
            <div>
              <b className="text-sm text-text">{w.word}</b> <Badge variant={w.cefr}>{w.cefr}</Badge>
              <div className="mt-0.5 text-xs text-text-muted">{w.meaning}</div>
            </div>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-sm text-lg text-text-muted transition-colors hover:bg-primary-soft hover:text-primary-text"
            aria-label={`Lưu từ ${w.word}`}
          >
            <Icon name="bookmark" />
          </button>
        </div>
      ))}
    </AsideCard>
  );
}

export function NotesCard() {
  const { t } = useTranslation("pages");
  return (
    <AsideCard
      title={t("student.lessonDetail.aside.notes", "Ghi chú của tôi")}
      aside={
        <Button variant="text" size="sm" leftIcon={<Icon name="plus" />}>
          {t("student.lessonDetail.aside.add", "Thêm")}
        </Button>
      }
    >
      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        {t("student.lessonDetail.aside.noNotes", "Chưa có ghi chú. Trong lúc luyện, bấm N để ghi chú cho câu đang học.")}
      </p>
    </AsideCard>
  );
}

export function RelatedLessons({ lessons, topicSlug, topicName }: { lessons: LessonSummary[]; topicSlug: string; topicName: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  return (
    <AsideCard title={t("student.lessonDetail.related.title", "Bài cùng chủ đề")}>
      {lessons.map((rel) => (
        <button
          key={rel.id}
          type="button"
          className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent p-2 text-left transition-colors hover:bg-surface-hover"
          onClick={() => navigate(`/student/lessons/${rel.slug}`)}
        >
          <div className="relative grid h-[52px] w-[88px] shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-primary-soft">
            {rel.thumbnailUrl ? (
              <img src={rel.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="headphones" className="text-base text-primary-text" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <b className="line-clamp-1 text-sm font-semibold text-text">{rel.title}</b>
            <div className="text-xs text-text-muted">
              {rel.difficulty ? `${rel.difficulty} · ` : ""}
              {formatDuration(rel.durationSec || 0)}
            </div>
          </div>
        </button>
      ))}
      <Button
        variant="secondary"
        fullWidth
        className="mt-3"
        rightIcon={<Icon name="arrow-right" />}
        onClick={() => navigate(topicSlug ? `/student/topics/${topicSlug}` : "/student/lessons")}
      >
        {topicSlug
          ? t("student.lessonDetail.related.viewTopic", { topic: topicName, defaultValue: "Xem cả chủ đề" })
          : t("student.lessonDetail.related.exploreLessons", "Khám phá thêm bài học")}
      </Button>
    </AsideCard>
  );
}
