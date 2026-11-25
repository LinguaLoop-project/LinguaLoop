import { useTranslation } from "react-i18next";
import Skeleton from "@/components/common/Skeleton";
import type { PracticeKind } from "../types";
import { usePracticeSession } from "../hooks";
import StatsError from "./StatsError";

const KIND_TONE = {
  normal: "text-text-muted",
  retry: "text-info",
  gave_up: "text-danger",
} as const;

/** Từng lượt của một Buổi luyện, từ mới đến cũ; tải khi học viên mở dòng (UC-TH-02, 3c). */
export default function SessionAttempts({
  lessonId,
  mode,
  day,
}: {
  lessonId: string;
  mode: PracticeKind;
  day: string;
}) {
  const { t, i18n } = useTranslation("stats");
  const query = usePracticeSession(lessonId, mode, day, true);
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";

  if (query.isError) {
    return <StatsError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  if (!query.data) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border" aria-label={t("history.attempts")}>
      {query.data.attempts.map((attempt) => (
        <li key={attempt.attemptId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
          <time dateTime={attempt.at} className="w-12 shrink-0 tabular-nums text-text-muted">
            {new Date(attempt.at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </time>
          <span className="min-w-0 flex-1 truncate" title={attempt.text}>
            {attempt.text}
          </span>
          <span className={`text-xs font-semibold ${KIND_TONE[attempt.kind]}`}>{t(`history.attemptKind.${attempt.kind}`)}</span>
          <b className="w-12 text-right tabular-nums">{t("history.attemptScore", { score: Math.round(attempt.score) })}</b>
        </li>
      ))}
    </ul>
  );
}
