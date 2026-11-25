import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { LookupWord, playPronunciation } from "@/features/dictionary";
import { useWrongWords } from "../hooks";
import type { StatsRange } from "../types";
import { percentOf } from "../utils";
import StatsError from "./StatsError";

function rankTone(index: number): string {
  if (index === 0) return "bg-danger/15 text-danger border-danger/30";
  if (index === 1) return "bg-warning/15 text-warning border-warning/30";
  if (index === 2) return "bg-primary-soft text-primary-text border-primary/30";
  return "bg-bg-elevated text-text-muted border-border";
}

/**
 * Mười từ nghe sai nhiều nhất (BR-TH-16). Nghe lại phát âm trực tiếp hoặc bấm "Lưu" để mở hộp tra từ và ôn như thẻ.
 */
export default function WrongWordsCard({ range }: { range: StatsRange }) {
  const { t } = useTranslation("stats");
  const query = useWrongWords(range);
  const shell = "rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";

  if (query.isError) {
    return (
      <section className={shell}>
        <StatsError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </section>
    );
  }

  return (
    <section className={shell} aria-busy={query.isFetching}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold">{t("weakness.words.title")}</h3>
        <Link to="/student/mywords" className="text-[13px] font-semibold text-primary-text hover:underline">
          {t("weakness.words.saved")}
        </Link>
      </div>
      <p className="mt-1 text-[13px] text-text-muted">{t("weakness.words.hint")}</p>

      {!query.data ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : query.data.words.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">{t("weakness.words.empty")}</p>
      ) : (
        <ol className="mt-4 flex flex-col divide-y divide-border">
          {query.data.words.map((item, index) => {
            const missPct = percentOf(item.wrongCount, item.seenCount);
            return (
              <li key={item.word.toLowerCase()} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold tabular-nums ${rankTone(index)}`}
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="truncate font-display text-base">{item.word}</b>
                    <Badge>{t(`weakness.dictation.class.${item.wordClass}`)}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>{t("weakness.words.wrong", { wrong: item.wrongCount, seen: item.seenCount })}</span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-elevated" aria-hidden="true">
                      <div className="h-full rounded-full bg-danger" style={{ width: `${missPct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={t("weakness.words.listen", { word: item.word })}
                    title={t("weakness.words.listen", { word: item.word })}
                    onClick={() => playPronunciation(item.word, "us", null)}
                  >
                    <Icon name="volume-2" />
                  </Button>
                  <LookupWord word={item.word} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    <Icon name="bookmark" />
                    {t("weakness.words.save")}
                  </LookupWord>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
