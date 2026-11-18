import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { buttonClasses } from "@/components/common/buttonStyles";
import { hasSuggestions } from "../flow";
import type { TodaySuggestions } from "../types";

export interface SuggestionCardsProps {
  suggestions: TodaySuggestions;
  /** Mục tiêu học mỗi ngày, hiện trong tiêu đề để gợi ý gắn với thời gian học học viên đã chọn. */
  dailyMinutes: number;
}

interface RowProps {
  icon: string;
  tone: string;
  title: string;
  meta: string;
  to: string;
  action: string;
}

function Row({ icon, tone, title, meta, to, action }: RowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-hover px-4 py-3">
      <span className={`grid h-10 w-10 flex-none place-items-center rounded-full bg-surface ${tone}`}>
        <Icon name={icon} className="text-xl" />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block leading-snug">{title}</b>
        <span className="text-[13px] text-text-muted">{meta}</span>
      </div>
      <Link to={to} className={buttonClasses({ variant: "primary", size: "sm" })}>
        {action}
        <Icon name="arrow-right" className="h-4 w-4" />
      </Link>
    </li>
  );
}

/**
 * Việc gợi ý khi không còn thẻ hay câu nào để ôn: phần từ mới kế tiếp và một bài nghe chép chưa làm, mỗi việc là một nút
 * vào thẳng. Không có gợi ý nào (đã học hết từ mới và luyện hết bài) thì không vẽ gì.
 */
export default function SuggestionCards({ suggestions, dailyMinutes }: SuggestionCardsProps) {
  const { t } = useTranslation("review");
  const { newWords, dictationLesson, shadowingLesson } = suggestions;
  if (!hasSuggestions(suggestions)) return null;

  return (
    <section aria-labelledby="today-suggest" className="flex flex-col gap-3">
      <h3 id="today-suggest" className="font-display text-lg font-bold">
        {t("suggest.title", { minutes: dailyMinutes })}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {newWords && (
          <Row
            icon="layers"
            tone="text-fn-vocab"
            title={t("suggest.newWords.title", { count: newWords.newCards })}
            meta={t(newWords.continuing ? "suggest.newWords.continuing" : "suggest.newWords.starting", {
              deck: newWords.deckName,
              part: newWords.partName,
              number: newWords.partNumber,
            })}
            to={`/student/vocab/${newWords.deckId}/parts/${newWords.partNumber}`}
            action={t("suggest.newWords.action")}
          />
        )}
        {dictationLesson && (
          <Row
            icon="headphones"
            tone="text-fn-dictation"
            title={t("suggest.lesson.title", { title: dictationLesson.title })}
            meta={t("suggest.lesson.meta", { level: dictationLesson.cefrLevel, count: dictationLesson.sentenceCount })}
            to={`/student/dictation/${dictationLesson.id}`}
            action={t("suggest.lesson.action")}
          />
        )}
        {shadowingLesson && (
          <Row
            icon="mic"
            tone="text-fn-shadowing"
            title={t("suggest.shadowing.title", { title: shadowingLesson.title })}
            meta={t("suggest.shadowing.meta", { level: shadowingLesson.cefrLevel, count: shadowingLesson.sentenceCount })}
            to={`/student/shadowing/${shadowingLesson.id}`}
            action={t("suggest.shadowing.action")}
          />
        )}
      </ul>
    </section>
  );
}
