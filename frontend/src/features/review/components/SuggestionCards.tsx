import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { hasSuggestions } from "../flow";
import type { TodaySuggestions } from "../types";

export interface SuggestionCardsProps {
  suggestions: TodaySuggestions;
  /** Mục tiêu học mỗi ngày, hiện trong tiêu đề để gợi ý gắn với thời gian học học viên đã chọn. */
  dailyMinutes: number;
}

interface CardItemProps {
  icon: string;
  iconShell: string;
  accentBorder: string;
  badgeText?: string;
  badgeVariant?: string;
  title: string;
  meta: string;
  to: string;
  action: string;
  actionTone: string;
}

function SuggestionCardItem({
  icon,
  iconShell,
  accentBorder,
  badgeText,
  badgeVariant,
  title,
  meta,
  to,
  action,
  actionTone,
}: CardItemProps) {
  return (
    <li className="flex">
      <Link
        to={to}
        className={`group flex w-full flex-col justify-between gap-3 rounded-lg border border-border bg-surface-hover/65 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-surface-hover ${accentBorder}`}
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className={`grid size-10 flex-none place-items-center rounded-lg ${iconShell}`}>
              <Icon name={icon} className="text-xl" />
            </span>
            {badgeText && <Badge variant={badgeVariant ?? "default"}>{badgeText}</Badge>}
          </div>
          <div className="min-w-0">
            <b className="line-clamp-1 block font-display text-base leading-snug">{title}</b>
            <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-text-muted">{meta}</span>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${actionTone}`}>
          {action}
          <Icon name="arrow-right" className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </Link>
    </li>
  );
}

/**
 * Việc gợi ý cho mục tiêu ngày: phần từ mới kế tiếp, một bài nghe chép và một bài Shadowing chưa làm.
 * Hiển thị dạng lưới thẻ tương tác để học viên bấm trực tiếp vào bất kỳ thẻ nào.
 */
export default function SuggestionCards({ suggestions, dailyMinutes }: SuggestionCardsProps) {
  const { t } = useTranslation("review");
  const { newWords, dictationLesson, shadowingLesson } = suggestions;
  if (!hasSuggestions(suggestions)) return null;

  return (
    <section aria-labelledby="today-suggest" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon name="sparkles" className="size-4 text-primary-text" />
        <h3 id="today-suggest" className="font-display text-base font-bold">
          {t("suggest.title", { minutes: dailyMinutes })}
        </h3>
      </div>
      <ul className="grid gap-3 md:grid-cols-3">
        {newWords && (
          <SuggestionCardItem
            icon="layers"
            iconShell="bg-fn-vocab-soft text-fn-vocab"
            accentBorder="hover:border-fn-vocab/50"
            badgeText={`+${newWords.newCards}`}
            badgeVariant="warning"
            title={t("suggest.newWords.title", { count: newWords.newCards })}
            meta={t(newWords.continuing ? "suggest.newWords.continuing" : "suggest.newWords.starting", {
              deck: newWords.deckName,
              part: newWords.partName,
              number: newWords.partNumber,
            })}
            to={`/student/vocab/${newWords.deckId}/parts/${newWords.partNumber}`}
            action={t("suggest.newWords.action")}
            actionTone="text-fn-vocab"
          />
        )}
        {dictationLesson && (
          <SuggestionCardItem
            icon="headphones"
            iconShell="bg-fn-dictation-soft text-fn-dictation"
            accentBorder="hover:border-fn-dictation/50"
            badgeText={dictationLesson.cefrLevel}
            badgeVariant={dictationLesson.cefrLevel}
            title={t("suggest.lesson.title", { title: dictationLesson.title })}
            meta={t("suggest.lesson.meta", { level: dictationLesson.cefrLevel, count: dictationLesson.sentenceCount })}
            to={`/student/dictation/${dictationLesson.id}`}
            action={t("suggest.lesson.action")}
            actionTone="text-fn-dictation"
          />
        )}
        {shadowingLesson && (
          <SuggestionCardItem
            icon="mic"
            iconShell="bg-fn-shadowing-soft text-fn-shadowing"
            accentBorder="hover:border-fn-shadowing/50"
            badgeText={shadowingLesson.cefrLevel}
            badgeVariant={shadowingLesson.cefrLevel}
            title={t("suggest.shadowing.title", { title: shadowingLesson.title })}
            meta={t("suggest.shadowing.meta", { level: shadowingLesson.cefrLevel, count: shadowingLesson.sentenceCount })}
            to={`/student/shadowing/${shadowingLesson.id}`}
            action={t("suggest.shadowing.action")}
            actionTone="text-fn-shadowing"
          />
        )}
      </ul>
    </section>
  );
}
