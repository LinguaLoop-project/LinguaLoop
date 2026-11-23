import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { playPronunciation } from "@/features/dictionary";
import { usePhoneme } from "../hooks";
import type { StatsRange } from "../types";
import { hasTrend, phonemeTone, practiceHref, trendPoints } from "../utils";
import StatsError from "./StatsError";

const TREND_W = 300;
const TREND_H = 60;

/** Chi tiết một âm vị: từ ví dụ, âm hay đọc nhầm, mẹo, xu hướng 8 tuần và nút "Luyện ngay" (BR-TH-10). */
export default function PhonemePanel({ symbol, range }: { symbol: string | null; range: StatsRange }) {
  const { t } = useTranslation("stats");
  const query = usePhoneme(symbol, range);
  const shell = "rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-20";

  if (symbol === null) {
    return (
      <aside className={shell}>
        <p className="text-sm text-text-muted">{t("weakness.detail.placeholder")}</p>
      </aside>
    );
  }
  if (query.isError) {
    return (
      <aside className={shell}>
        <StatsError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </aside>
    );
  }
  const detail = query.data;
  if (!detail) {
    return (
      <aside className={shell} aria-busy="true">
        <Skeleton className="mb-3 h-10 w-24" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-24 w-full" />
      </aside>
    );
  }

  const { cell } = detail;
  const enough = cell.level !== "insufficient";
  const example = cell.exampleWord ?? "";

  return (
    <aside className={shell} aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-4xl font-bold leading-none">/{cell.symbol}/</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${phonemeTone(cell.level)}`}>
          {cell.errorPercent === null ? t("weakness.map.legend.insufficient") : t("weakness.map.cellPercent", { percent: cell.errorPercent })}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {example && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="volume-2" />}
            aria-label={t("weakness.detail.listen", { word: example })}
            onClick={() => playPronunciation(example, "us", null)}
          >
            {example}
          </Button>
        )}
        {enough && <span className="text-[13px] text-text-muted">{t("weakness.detail.errors", { count: cell.errors })}</span>}
      </div>

      {!enough ? (
        <p className="mt-4 text-sm text-text-muted">{t("weakness.detail.insufficient", { word: example })}</p>
      ) : (
        <>
          {(detail.confusedAs || detail.mostlyOmitted) && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm">
              <Icon name="ear" className="mt-0.5 size-4 shrink-0 text-primary-text" />
              <span>
                {t("weakness.detail.confusedAs")}{" "}
                <b>{detail.mostlyOmitted ? t("weakness.detail.omitted") : `/${detail.confusedAs}/`}</b>
              </span>
            </div>
          )}

          {detail.tip && (
            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text">{t("weakness.detail.tip")}</h3>
              <p className="mt-1 text-sm">{detail.tip}</p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text">{t("weakness.detail.trend")}</h3>
            {hasTrend(detail.trend) ? (
              <svg
                className="mt-2 h-16 w-full"
                viewBox={`0 0 ${TREND_W} ${TREND_H}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={t("weakness.detail.trendAria", { percent: detail.trend[detail.trend.length - 1]?.errorPercent ?? 0 })}
              >
                <polyline
                  points={trendPoints(detail.trend, TREND_W, TREND_H)}
                  fill="none"
                  className="stroke-danger"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : (
              <p className="mt-1 text-[13px] text-text-muted">{t("weakness.detail.trendEmpty")}</p>
            )}
          </div>

          <Link to={practiceHref(detail)} className={buttonClasses({ variant: "primary", fullWidth: true, className: "mt-5" })}>
            <Icon name="target" />
            {detail.practiceLessonId ? t("weakness.detail.practice") : t("weakness.detail.practiceLibrary")}
          </Link>
        </>
      )}
    </aside>
  );
}
