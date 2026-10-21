import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import type { DictationLesson, DictationLevel } from "../types";
import { averageScore, dominantLevel, nextHarderLevel, SCORE_TEXT, scoreBuckets, scoreTone, type ScoreTone } from "../utils";

export interface CompletionScreenProps {
  lesson: DictationLesson;
  /** Mức dự phòng khi bài chưa có câu nào tính điểm; thường gợi ý mức khó hơn tính theo mức đã làm nhiều nhất. */
  level: DictationLevel;
  onRedo: (level: DictationLevel) => void;
  /** Quay lại làm câu thứ `index` (câu điểm thấp). */
  onSelectSentence: (index: number) => void;
}

const BUCKETS: ScoreTone[] = ["good", "mid", "bad"];

/** Màn hoàn thành bài: điểm trung bình, số câu theo mức điểm, các câu nên nghe lại, gợi ý bước tiếp theo. */
export default function CompletionScreen({ lesson, level, onRedo, onSelectSentence }: CompletionScreenProps) {
  const { t } = useTranslation("dictation");
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const average = averageScore(lesson.sentences);
  const buckets = scoreBuckets(lesson.sentences);
  const harder = nextHarderLevel(dominantLevel(lesson.sentences, level));
  const suggestHarder = harder !== null && average !== null && average >= 80;
  const weak = lesson.sentences.flatMap((sentence, index) =>
    sentence.latest && sentence.latest.score < 60 ? [{ sentence, index }] : [],
  );

  // Màn này thay khung làm bài đang cuộn ở giữa trang: đưa tiêu đề vào tầm nhìn và cho trình đọc màn hình biết đã đổi màn.
  useEffect(() => {
    card.current?.scrollIntoView({ block: "start" });
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={card} className="mx-auto flex w-full max-w-[640px] scroll-mt-20 flex-col items-center gap-5 rounded-xl border border-border bg-surface px-6 py-8 text-center shadow-[var(--shadow-card)]">
      <Mascot mood={average !== null && average >= 80 ? "correct" : "listening"} size={96} alt="" />
      <div>
        <h2 ref={heading} tabIndex={-1} className="text-2xl outline-none">
          {t("done.title")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{lesson.title}</p>
      </div>
      <div className="rounded-lg bg-surface-hover px-8 py-3">
        <b className={`block font-display text-5xl font-extrabold leading-tight ${average === null ? "text-text-muted" : SCORE_TEXT[scoreTone(average)]}`}>
          {average ?? "–"}
        </b>
        <span className="text-xs">{average === null ? t("done.noScore") : t("done.average")}</span>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {BUCKETS.map((tone) => (
          <li key={tone} className="flex items-baseline gap-1.5">
            <b className={`text-xl ${SCORE_TEXT[tone]}`}>{buckets[tone]}</b>
            <span className="text-text-muted">{t(`done.${tone}`)}</span>
          </li>
        ))}
      </ul>
      {weak.length > 0 && (
        <div className="w-full text-left">
          <div className="mb-2 text-sm font-semibold">{t("done.weak")}</div>
          <ul className="flex flex-wrap gap-2">
            {weak.map(({ sentence, index }) => (
              <li key={sentence.id}>
                <Button variant="ghost" size="sm" onClick={() => onSelectSentence(index)}>
                  {t("done.sentenceN", { n: index + 1 })} · {Math.round(sentence.latest?.score ?? 0)}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {suggestHarder && <p className="text-sm text-text-muted">{t("done.suggest")}</p>}
      <div className="flex flex-wrap justify-center gap-2.5">
        {suggestHarder && harder && (
          <Button leftIcon={<Icon name="rotate-ccw" />} onClick={() => onRedo(harder)}>
            {t("done.redo", { level: t(`level.${harder}`) })}
          </Button>
        )}
        <Link
          to={`/student/shadowing/${lesson.slug}`}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong px-4 text-sm font-semibold transition-colors duration-150 hover:bg-surface-hover"
        >
          <Icon name="mic" />
          {t("done.shadowing")}
        </Link>
        <Link
          to={`/student/lessons/${lesson.slug}`}
          className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-text-muted transition-colors duration-150 hover:text-text"
        >
          {t("done.back")}
        </Link>
      </div>
    </div>
  );
}
