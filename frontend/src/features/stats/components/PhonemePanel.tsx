import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { playPronunciation } from "@/features/dictionary";
import { usePhoneme } from "../hooks";
import type { StatsRange } from "../types";
import { hasTrend, phonemeTone, practiceHref, weeksWithData } from "../utils";
import StatsError from "./StatsError";

const TREND_W = 320;
const TREND_H = 88;
const PAD_X = 24;
const PAD_Y = 10;

/** Chi tiết một âm vị: đối chiếu âm đích/âm nhầm, mẹo khẩu hình, biểu đồ xu hướng 8 tuần tương tác và nút "Luyện ngay" (BR-TH-10). */
export default function PhonemePanel({ symbol, range }: { symbol: string | null; range: StatsRange }) {
  const { t, i18n } = useTranslation("stats");
  const [hoveredWeek, setHoveredWeek] = useState<{ symbol: string; index: number } | null>(null);
  const gradId = useId();
  const query = usePhoneme(symbol, range);
  const shell = "rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-20";

  if (symbol === null) {
    return (
      <aside className={shell}>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary-text">
            <Icon name="audio-lines" className="size-6" />
          </span>
          <p className="mt-3 text-sm text-text-muted">{t("weakness.detail.placeholder")}</p>
        </div>
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
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", timeZone: "UTC" });
  const fmtWeek = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
  };

  const plotW = TREND_W - PAD_X * 2;
  const plotH = TREND_H - PAD_Y * 2;
  const step = detail.trend.length > 1 ? plotW / (detail.trend.length - 1) : 0;
  const validCoords = detail.trend
    .map((pt, i) => {
      if (pt.errorPercent === null) return null;
      const x = PAD_X + i * step;
      const y = PAD_Y + ((100 - pt.errorPercent) / 100) * plotH;
      return { x, y, index: i, point: pt };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const polyPoints = validCoords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath =
    validCoords.length > 1
      ? `M ${validCoords[0].x.toFixed(1)},${(TREND_H - PAD_Y).toFixed(1)} ` +
        validCoords.map((c) => `L ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ") +
        ` L ${validCoords[validCoords.length - 1].x.toFixed(1)},${(TREND_H - PAD_Y).toFixed(1)} Z`
      : "";

  const activeIndex = hoveredWeek?.symbol === cell.symbol ? hoveredWeek.index : null;
  const activePoint = activeIndex !== null ? validCoords.find((c) => c.index === activeIndex)?.point : null;

  return (
    <aside className={shell} aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl font-bold leading-none">/{cell.symbol}/</h2>
          {enough && (
            <p className="mt-1.5 text-xs font-medium text-text-muted">
              {t("weakness.detail.errorRatio", { errors: cell.errors, total: cell.total })}
            </p>
          )}
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${phonemeTone(cell.level)}`}>
          {cell.errorPercent === null ? t("weakness.map.legend.insufficient") : t("weakness.map.cellPercent", { percent: cell.errorPercent })}
        </span>
      </div>

      {example && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="volume-2" />}
            aria-label={t("weakness.detail.listen", { word: example })}
            onClick={() => playPronunciation(example, "us", null)}
          >
            {example}
          </Button>
        </div>
      )}

      {!enough ? (
        <p className="mt-4 rounded-md border border-border bg-bg-elevated p-3 text-sm text-text-muted">
          {t("weakness.detail.insufficient", { word: example })}
        </p>
      ) : (
        <>
          {(detail.confusedAs || detail.mostlyOmitted) && (
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-border bg-bg-elevated p-3 text-center">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                  {t("weakness.detail.targetSound")}
                </span>
                <b className="mt-0.5 font-display text-xl text-success">/{cell.symbol}/</b>
              </div>
              <Icon name="arrow-right" className="size-4 text-text-muted" />
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
                  {t("weakness.detail.confusedAs")}
                </span>
                <b className="mt-0.5 font-display text-lg leading-tight text-danger">
                  {detail.mostlyOmitted ? t("weakness.detail.omitted") : `/${detail.confusedAs}/`}
                </b>
              </div>
            </div>
          )}

          {detail.tip && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3.5">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-warning">
                <Icon name="lightbulb" className="size-3.5" />
                {t("weakness.detail.tip")}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text">{detail.tip}</p>
            </div>
          )}

          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text">{t("weakness.detail.trend")}</h3>
              {activePoint && (
                <span className="text-[11px] font-medium text-text">
                  {t("weakness.detail.trendWeekDetail", {
                    date: fmtWeek(activePoint.weekStart),
                    percent: activePoint.errorPercent ?? 0,
                    errors: activePoint.errors,
                    total: activePoint.total,
                  })}
                </span>
              )}
            </div>
            {hasTrend(detail.trend) ? (
              <svg
                className="mt-2 h-24 w-full overflow-visible"
                viewBox={`0 0 ${TREND_W} ${TREND_H}`}
                role="img"
                aria-label={t("weakness.detail.trendAria", { percent: detail.trend[detail.trend.length - 1]?.errorPercent ?? 0 })}
                onMouseLeave={() => setHoveredWeek(null)}
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--danger)" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {[100, 50, 0].map((val) => {
                  const y = PAD_Y + ((100 - val) / 100) * plotH;
                  return (
                    <g key={val}>
                      <line
                        x1={PAD_X}
                        x2={TREND_W - PAD_X}
                        y1={y}
                        y2={y}
                        stroke="var(--border)"
                        strokeDasharray={val === 0 ? undefined : "3 3"}
                      />
                      <text x={PAD_X - 5} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-subtle)">
                        {val}%
                      </text>
                    </g>
                  );
                })}
                {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
                <polyline
                  points={polyPoints}
                  fill="none"
                  className="stroke-danger"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {validCoords.map((c) => {
                  const active = activeIndex === c.index;
                  return (
                    <g key={c.point.weekStart}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={active ? 5 : 3.2}
                        className="fill-danger stroke-surface"
                        strokeWidth="1.8"
                      />
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r="12"
                        fill="transparent"
                        tabIndex={0}
                        className="cursor-pointer outline-none focus-visible:stroke-primary focus-visible:stroke-2"
                        onMouseEnter={() => setHoveredWeek({ symbol: cell.symbol, index: c.index })}
                        onFocus={() => setHoveredWeek({ symbol: cell.symbol, index: c.index })}
                      />
                    </g>
                  );
                })}
              </svg>
            ) : (
              <p className="mt-1 text-[13px] text-text-muted">
                {weeksWithData(detail.trend) === 0 ? t("weakness.detail.trendEmpty") : t("weakness.detail.trendFew")}
              </p>
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
