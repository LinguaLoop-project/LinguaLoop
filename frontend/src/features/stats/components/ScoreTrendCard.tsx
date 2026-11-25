import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PronunciationOverview } from "../types";
import DeltaBadge from "./DeltaBadge";

const W = 600;
const H = 132;
const PAD_X = 28;
const PAD_Y = 12;

/** Điểm Shadowing trung bình theo ngày (7 và 30 ngày) hoặc theo tuần (Toàn bộ) với biểu đồ diện tích tương tác (BR-TH-08). */
export default function ScoreTrendCard({ data }: { data: PronunciationOverview }) {
  const { t, i18n } = useTranslation("stats");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradId = useId();
  const scores = data.scores;
  const latest = scores[scores.length - 1];
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", timeZone: "UTC" });

  const formatDate = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
  };

  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_Y * 2;
  const coords = scores.map((p, i) => {
    const x = scores.length > 1 ? PAD_X + (i * plotW) / (scores.length - 1) : W / 2;
    const y = PAD_Y + ((100 - Math.min(100, Math.max(0, p.averageScore))) / 100) * plotH;
    return { x, y, point: p };
  });

  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath =
    coords.length > 1
      ? `M ${coords[0].x.toFixed(1)},${(H - PAD_Y).toFixed(1)} ` +
        coords.map((c) => `L ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ") +
        ` L ${coords[coords.length - 1].x.toFixed(1)},${(H - PAD_Y).toFixed(1)} Z`
      : "";

  const hovered = hoveredIndex !== null ? coords[hoveredIndex]?.point : null;

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold">{t("weakness.scores.title")}</h3>
            <span className="rounded-full border border-border bg-bg-elevated px-2.5 py-0.5 text-[11px] font-semibold text-text-muted">
              {data.weekly ? t("weakness.scores.weekly") : t("weakness.scores.daily")}
            </span>
          </div>
          {latest && (
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-bold tabular-nums text-fn-shadowing">
                {t("weakness.scores.latest", { score: Math.round(latest.averageScore) })}
              </span>
              {data.averageScore !== null && (
                <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-text-muted">
                  {t("weakness.scores.average", { score: data.averageScore })}
                  {data.scoreDelta !== null && <DeltaBadge delta={data.scoreDelta} range={data.range} />}
                </span>
              )}
            </div>
          )}
        </div>
        {latest && (
          <div className="rounded-md border border-border/70 bg-bg-elevated/70 px-3 py-1.5 text-xs font-medium text-text-muted">
            {hovered ? (
              <span className="text-text">
                {t("weakness.scores.pointDetail", {
                  date: formatDate(hovered.from),
                  score: Math.round(hovered.averageScore),
                  attempts: hovered.attempts,
                })}
              </span>
            ) : (
              t("weakness.scores.hoverHint")
            )}
          </div>
        )}
      </div>

      {latest ? (
        <div className="mt-4">
          <svg
            className="h-[136px] w-full overflow-visible"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={t("weakness.scores.aria", { score: Math.round(latest.averageScore) })}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--fn-shadowing)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--fn-shadowing)" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {[100, 50, 0].map((val) => {
              const y = PAD_Y + ((100 - val) / 100) * plotH;
              return (
                <g key={val}>
                  <line
                    x1={PAD_X}
                    x2={W - PAD_X}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray={val === 0 ? undefined : "4 4"}
                    strokeWidth="1"
                  />
                  <text x={PAD_X - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--text-subtle)">
                    {val}
                  </text>
                </g>
              );
            })}

            {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

            {coords.length > 1 && (
              <polyline
                points={linePoints}
                fill="none"
                className="stroke-fn-shadowing"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {coords.map((c, idx) => {
              const isActive = hoveredIndex === idx;
              return (
                <g key={c.point.from}>
                  {isActive && (
                    <line
                      x1={c.x}
                      x2={c.x}
                      y1={PAD_Y}
                      y2={H - PAD_Y}
                      stroke="var(--fn-shadowing)"
                      strokeOpacity="0.35"
                      strokeDasharray="3 3"
                    />
                  )}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isActive ? 5.5 : 3.5}
                    className="fill-fn-shadowing stroke-surface transition-all"
                    strokeWidth="2"
                  />
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="14"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />
                </g>
              );
            })}
          </svg>
          <div className="mt-1 flex items-center justify-between px-6 text-[11px] text-text-subtle">
            <span>{formatDate(scores[0].from)}</span>
            {scores.length > 1 && <span>{formatDate(latest.from)}</span>}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-text-muted">{t("weakness.scores.empty")}</p>
      )}
    </section>
  );
}
