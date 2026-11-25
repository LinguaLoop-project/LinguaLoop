import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { useDictationErrors } from "../hooks";
import type { StatsRange } from "../types";
import { dictationPracticeHref, errorSegments } from "../utils";
import StatsError from "./StatsError";
import WordClassHelp from "./WordClassHelp";

const CAUSES = [
  { key: "omitted", bar: "bg-danger", text: "text-danger" },
  { key: "substituted", bar: "bg-warning", text: "text-warning" },
  { key: "misspelled", bar: "bg-info", text: "text-info" },
] as const;

/** Lỗi Nghe chép theo sáu nhóm từ, chia thanh ba nguyên nhân và gắn nhãn nhóm ưu tiên sửa (BR-TH-05, BR-TH-12). */
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

  const classes = query.data?.classes ?? [];
  const worstClass = classes.reduce<(typeof classes)[number] | null>(
    (worst, cur) => (cur.errors > 0 && (!worst || cur.errorPercent > worst.errorPercent) ? cur : worst),
    null,
  );

  return (
    <section className={shell} aria-busy={query.isFetching}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-bold">{t("weakness.dictation.title")}</h3>
        <WordClassHelp />
      </div>
      {!query.data ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {classes.map((row) => {
            const segments = errorSegments(row);
            const isPriority = worstClass?.wordClass === row.wordClass;
            const causeCounts = {
              omitted: row.omitted + row.revealed,
              substituted: row.substituted,
              misspelled: row.misspelled,
            };

            return (
              <li
                key={row.wordClass}
                className={`rounded-md border p-3.5 transition-colors ${
                  isPriority ? "border-danger/35 bg-danger/5" : "border-border/60 bg-bg-elevated/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="font-semibold">{t(`weakness.dictation.class.${row.wordClass}`)}</b>
                    {isPriority && <Badge tone="danger">{t("weakness.dictation.priority")}</Badge>}
                    {row.opportunities > 0 && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums ${
                          row.errorPercent > 20 ? "border-danger/40 bg-danger/10 text-danger" : "border-border bg-surface text-text-muted"
                        }`}
                      >
                        {t("weakness.dictation.errorRate", { percent: row.errorPercent })}
                      </span>
                    )}
                  </div>
                  {row.errors > 0 && (
                    <Link
                      to={dictationPracticeHref(row)}
                      aria-label={t("weakness.dictation.practiceAria", {
                        action: row.practiceLessonId ? t("weakness.dictation.practice") : t("weakness.dictation.practiceLibrary"),
                        group: t(`weakness.dictation.class.${row.wordClass}`),
                      })}
                      className={buttonClasses({ variant: "ghost", size: "sm" })}
                    >
                      <Icon name="target" />
                      {row.practiceLessonId ? t("weakness.dictation.practice") : t("weakness.dictation.practiceLibrary")}
                    </Link>
                  )}
                </div>

                <div className="mb-2 mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated" aria-hidden="true">
                  {CAUSES.map(({ key, bar }) =>
                    segments[key] > 0 ? (
                      <span
                        key={key}
                        className={bar}
                        title={`${t(`weakness.dictation.cause.${key}`)}: ${causeCounts[key]}`}
                        style={{ width: `${segments[key]}%` }}
                      />
                    ) : null,
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] text-text-muted">
                  <span>
                    {row.opportunities === 0
                      ? t("weakness.dictation.noData")
                      : row.lastWrongWord
                        ? t("weakness.dictation.lastWrong", { word: row.lastWrongWord })
                        : t("weakness.dictation.noError")}
                    {row.opportunities > 0 && <> · {t("weakness.dictation.opportunities", { count: row.opportunities })}</>}
                  </span>

                  {row.errors > 0 && (
                    <span className="flex flex-wrap items-center gap-x-2.5 text-xs font-medium">
                      {CAUSES.map(({ key, text }) =>
                        causeCounts[key] > 0 ? (
                          <span key={key} className={text}>
                            {t(`weakness.dictation.cause.${key}`)}: {causeCounts[key]}
                          </span>
                        ) : null,
                      )}
                    </span>
                  )}
                </div>
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
