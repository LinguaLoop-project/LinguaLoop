import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { LookupWord } from "@/features/dictionary";
import { useWrongWords } from "../hooks";
import type { StatsRange } from "../types";
import StatsError from "./StatsError";

/**
 * Mười từ nghe sai nhiều nhất (BR-TH-16). "Lưu vào từ vựng" mở hộp tra từ để chọn nghĩa cần lưu; từ đã lưu xuất hiện ở
 * Từ & câu đã lưu và được ôn như một thẻ.
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
        <h2 className="font-display text-xl font-bold">{t("weakness.words.title")}</h2>
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
          {query.data.words.map((item, index) => (
            <li key={item.word.toLowerCase()} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <span className="w-6 text-sm font-bold tabular-nums text-text-muted">{index + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <b className="truncate text-base">{item.word}</b>
                <span className="text-[13px] text-text-muted">
                  {t(`weakness.dictation.class.${item.wordClass}`)} · {t("weakness.words.wrong", { wrong: item.wrongCount, seen: item.seenCount })}
                </span>
              </div>
              <LookupWord word={item.word} className={buttonClasses({ variant: "ghost", size: "sm" })}>
                <Icon name="bookmark" />
                {t("weakness.words.save")}
              </LookupWord>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
