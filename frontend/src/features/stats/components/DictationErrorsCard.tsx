import { useTranslation } from "react-i18next";
import Skeleton from "@/components/common/Skeleton";
import { useDictationErrors } from "../hooks";
import type { StatsRange } from "../types";
import { errorSegments } from "../utils";
import StatsError from "./StatsError";

const CAUSES = [
  { key: "omitted", bar: "bg-danger" },
  { key: "substituted", bar: "bg-warning" },
  { key: "misspelled", bar: "bg-info" },
] as const;

/** Lỗi Nghe chép theo sáu nhóm từ, chia thanh ba nguyên nhân (BR-TH-05, BR-TH-12). */
export default function DictationErrorsCard({ range }: { range: StatsRange }) {
  const { t } = useTranslation("stats");
  const query = useDictationErrors(range);
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
      <h2 className="mb-4 font-display text-xl font-bold">{t("weakness.dictation.title")}</h2>
      {!query.data ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {query.data.classes.map((row) => {
            const segments = errorSegments(row);
            return (
              <li key={row.wordClass}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <b>{t(`weakness.dictation.class.${row.wordClass}`)}</b>
                  {row.opportunities > 0 && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-bold ${
                        row.errorPercent > 20 ? "border-danger/40 bg-danger/10 text-danger" : "border-border bg-bg-elevated text-text-muted"
                      }`}
                    >
                      {t("weakness.dictation.errorRate", { percent: row.errorPercent })}
                    </span>
                  )}
                </div>
                <div className="mb-1 mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated" aria-hidden="true">
                  {CAUSES.map(({ key, bar }) =>
                    segments[key] > 0 ? <span key={key} className={bar} style={{ width: `${segments[key]}%` }} /> : null,
                  )}
                </div>
                <p className="text-[13px] text-text-muted">
                  {row.opportunities === 0
                    ? t("weakness.dictation.noData")
                    : row.lastWrongWord
                      ? t("weakness.dictation.lastWrong", { word: row.lastWrongWord })
                      : t("weakness.dictation.noError")}
                  {row.opportunities > 0 && <> · {t("weakness.dictation.opportunities", { count: row.opportunities })}</>}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
        {CAUSES.map(({ key, bar }) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${bar}`} aria-hidden="true" />
            {t(`weakness.dictation.cause.${key}`)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-text-subtle">{t("weakness.dictation.revealedNote")}</p>
    </section>
  );
}
