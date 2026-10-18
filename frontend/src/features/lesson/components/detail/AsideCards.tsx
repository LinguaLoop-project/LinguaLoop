import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import ProgressRing from "@/components/common/ProgressRing";
import { formatDuration } from "@/lib/format";
import type { LessonSummary, ModeProgress } from "../../types";
import LessonThumb from "../LessonThumb";

const OVERLINE = "text-[15px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text";

function AsideCard({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className={OVERLINE}>{title}</div>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** 0 giây hiện "—"; dưới 1 phút vẫn hiện 1 phút để người học thấy mình đã có thời gian học. */
const studyTime = (sec: number, t: (key: string, fallback: string) => string) =>
  sec > 0 ? `${Math.max(1, Math.round(sec / 60))} ${t("student.lessonDetail.aside.minutes", "phút")}` : "—";

const pct = (n: number) => (n > 0 ? `${Math.round(n)}%` : "—");

/** Tiến độ tổng (trung bình hai chế độ) và từng chế độ. */
export function ProgressCard({ progress }: { progress: ModeProgress }) {
  const { t } = useTranslation("pages");
  const overall = Math.round((progress.dictationPercent + progress.shadowingPercent) / 2);
  const row = "flex items-center justify-between";
  const label = "flex items-center gap-2 text-text-muted [&>svg]:h-5 [&>svg]:w-5";
  return (
    <AsideCard title={t("student.lessonDetail.aside.progress", "Tiến độ của bạn")}>
      <div className="mt-4 flex items-center gap-4">
        <ProgressRing value={overall} size={88} label="%" ariaLabel={t("student.lessonDetail.aside.progress", "Tiến độ của bạn")} />
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-[13px]">
          <div className={row}>
            <span className={label}>
              <Icon name="headphones" />
              {t("student.lessonDetail.dictation.title", "Nghe chép")}
            </span>
            <b>{pct(progress.dictationPercent)}</b>
          </div>
          <div className={row}>
            <span className={label}>
              <Icon name="mic" />
              {t("student.lessonDetail.shadowing.title", "Shadowing")}
            </span>
            <b>{pct(progress.shadowingPercent)}</b>
          </div>
          <div className={row}>
            <span className={label}>
              <Icon name="clock" />
              {t("student.lessonDetail.aside.studyTime", "Thời gian học")}
            </span>
            <b>{studyTime(progress.studyTimeSec, t)}</b>
          </div>
        </div>
      </div>
    </AsideCard>
  );
}

// TODO: thay bằng từ vựng thật của bài khi backend có API (hiện là dữ liệu mẫu).
const SAMPLE_WORDS = [
  { word: "latte", cefr: "B1", meaning: "cà phê latte (cà phê sữa kiểu Ý)" },
  { word: "go", cefr: "A1", meaning: "đi" },
  { word: "present", cefr: "B1", meaning: "có mặt, hiện diện" },
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
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const toggle = (word: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (!next.delete(word)) next.add(word);
      return next;
    });
  return (
    <AsideCard
      title={t("student.lessonDetail.aside.vocab", "Từ vựng trong bài")}
      aside={
        <Button variant="text" size="sm" onClick={() => setSaved(new Set(SAMPLE_WORDS.map((w) => w.word)))}>
          {t("student.lessonDetail.aside.saveAll", "Lưu tất cả")}
        </Button>
      }
    >
      {SAMPLE_WORDS.map((w) => (
        <div key={w.word} className="flex items-center justify-between gap-2 border-b border-border py-2.5 last:border-b-0">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" iconOnly aria-label={`Nghe ${w.word}`} onClick={() => speak(w.word)}>
              <Icon name="volume-2" />
            </Button>
            <div className="min-w-0">
              <b>{w.word}</b> <Badge variant={w.cefr}>{w.cefr}</Badge>
              <div className="text-[13px] leading-normal text-text-muted">{w.meaning}</div>
            </div>
          </div>
          <button
            type="button"
            aria-pressed={saved.has(w.word)}
            aria-label={`Lưu từ ${w.word}`}
            onClick={() => toggle(w.word)}
            className={`grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-sm border-0 bg-transparent hover:bg-surface-hover ${saved.has(w.word) ? "text-fn-vocab" : "text-text-subtle hover:text-text"}`}
          >
            <Icon name="bookmark" fill={saved.has(w.word)} />
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
      <p className="mt-2 text-[13px] leading-normal text-text-muted">
        {t("student.lessonDetail.aside.noNotesBefore", "Chưa có ghi chú. Trong lúc luyện, bấm")}{" "}
        <kbd className="rounded-md border border-border-strong bg-bg-elevated px-1.5 py-1 font-body text-[11px] font-semibold leading-none text-text-muted">N</kbd>{" "}
        {t("student.lessonDetail.aside.noNotesAfter", "để ghi chú cho câu đang học.")}
      </p>
    </AsideCard>
  );
}

export function RelatedLessons({ lessons, topicSlug }: { lessons: LessonSummary[]; topicSlug: string; topicName?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  return (
    <AsideCard title={t("student.lessonDetail.related.title", "Bài cùng chủ đề")}>
      {lessons.map((rel) => (
        <div
          key={rel.id}
          role="link"
          tabIndex={0}
          onClick={() => navigate(`/student/lessons/${rel.slug}`)}
          onKeyDown={(e) => e.key === "Enter" && navigate(`/student/lessons/${rel.slug}`)}
          className="group grid grid-cols-[40%_60%] cursor-pointer items-center gap-3 py-3"
        >
          <LessonThumb lesson={rel} corners={false} compact className="h-full rounded-sm" />
          <div className="min-w-0">
            <b className="text-[13px] font-bold leading-[1.35]">{rel.title}</b>
            <div className="text-[13px] leading-normal text-text-muted">
              {rel.difficulty ? `${rel.difficulty} · ` : ""}
              {formatDuration(rel.durationSec || 0)}
            </div>
          </div>
        </div>
      ))}
      <Button variant="text" size="sm" className="mt-2" onClick={() => navigate(topicSlug ? `/student/topics/${topicSlug}` : "/student/lessons")}>
        {topicSlug ? t("student.lessonDetail.related.viewTopic", "Xem cả chủ đề") : t("student.lessonDetail.related.exploreLessons", "Khám phá thêm bài học")}
        <Icon name="arrow-right" />
      </Button>
    </AsideCard>
  );
}
