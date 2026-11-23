import { useTranslation } from "react-i18next";
import type { PronunciationOverview } from "../types";
import { scorePoints } from "../utils";
import DeltaBadge from "./DeltaBadge";

const W = 300;
const H = 72;

/** Điểm Shadowing trung bình theo ngày (7 và 30 ngày) hoặc theo tuần (Toàn bộ) (BR-TH-08). */
export default function ScoreTrendCard({ data }: { data: PronunciationOverview }) {
  const { t } = useTranslation("stats");
  const latest = data.scores[data.scores.length - 1];
  const points = scorePoints(data.scores, W, H);
  const single = data.scores.length === 1;

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold">{t("weakness.scores.title")}</h2>
        <span className="text-xs text-text-muted">{data.weekly ? t("weakness.scores.weekly") : t("weakness.scores.daily")}</span>
      </div>
      {latest ? (
        <>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-fn-shadowing">
            {t("weakness.scores.latest", { score: Math.round(latest.averageScore) })}
          </p>
          {data.averageScore !== null && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-text-muted">
              {t("weakness.scores.average", { score: data.averageScore })}
              {data.scoreDelta !== null && <DeltaBadge delta={data.scoreDelta} range={data.range} />}
            </p>
          )}
          <svg
            className="mt-2 h-[72px] w-full"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={t("weakness.scores.aria", { score: Math.round(latest.averageScore) })}
          >
            {single ? (
              <circle cx={points.split(",")[0]} cy={points.split(",")[1]} r="4" className="fill-fn-shadowing" />
            ) : (
              <polyline
                points={points}
                fill="none"
                className="stroke-fn-shadowing"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        </>
      ) : (
        <p className="mt-3 text-sm text-text-muted">{t("weakness.scores.empty")}</p>
      )}
    </section>
  );
}
