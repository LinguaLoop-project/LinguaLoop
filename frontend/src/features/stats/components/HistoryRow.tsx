import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { buttonClasses } from "@/components/common/buttonStyles";
import type { HistoryItem } from "../types";
import { historyHref, practiceKind } from "../utils";
import SessionAttempts from "./SessionAttempts";

/** Biểu tượng và màu chức năng của từng loại dòng lịch sử. */
function visualOf(item: HistoryItem): { icon: string; tone: string } {
  if (item.type === "vocab") return { icon: "layers", tone: "bg-fn-vocab-soft text-fn-vocab" };
  if (item.type === "ai") return { icon: "bot", tone: "bg-primary-soft text-primary-text" };
  return item.mode === "shadowing"
    ? { icon: "mic", tone: "bg-fn-shadowing-soft text-fn-shadowing" }
    : { icon: "headphones", tone: "bg-fn-dictation-soft text-fn-dictation" };
}

/** Một dòng Lịch sử luyện tập: Buổi luyện, phiên từ vựng hoặc phiên AI (BR-TH-06). */
export default function HistoryRow({ item }: { item: HistoryItem }) {
  const { t, i18n } = useTranslation("stats");
  const [expanded, setExpanded] = useState(false);
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  const { icon, tone } = visualOf(item);
  const href = historyHref(item);
  const kind = practiceKind(item);
  const when = new Date(item.at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  const title =
    item.title ?? (item.type === "vocab" ? t("history.allDecks") : item.type === "ai" ? t("history.aiLive") : "");
  const facts: string[] = [];
  if (item.type === "practice") {
    facts.push(t("history.sentences", { count: item.sentences ?? 0 }));
    if (item.averageScore !== null) facts.push(t("history.average", { score: Math.round(item.averageScore) }));
    if ((item.retries ?? 0) > 0) facts.push(t("history.retries", { count: item.retries }));
    if ((item.gaveUps ?? 0) > 0) facts.push(t("history.gaveUps", { count: item.gaveUps }));
  } else if (item.type === "vocab") {
    facts.push(item.mode === "learn" ? t("history.vocabLearn") : t("history.vocabReview"));
    facts.push(t("history.vocabResult", { correct: item.correct ?? 0, answered: item.answered ?? 0 }));
  } else {
    facts.push(item.mode === "live" ? t("history.aiLive") : t("history.aiText"));
    facts.push(t("history.aiResult", { count: item.answered ?? 0 }));
  }

  return (
    <li className="rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tone}`} aria-hidden="true">
          <Icon name={icon} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold" title={title}>
            {title}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] text-text-muted">
            <time dateTime={item.at}>{when}</time>
            <span aria-hidden="true">·</span>
            <span>{facts.join(" · ")}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {kind && (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={expanded}
              rightIcon={<Icon name={expanded ? "chevron-up" : "chevron-down"} />}
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? t("history.collapse") : t("history.expand")}
            </Button>
          )}
          {href ? (
            <Link to={href} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              {t("history.open")}
            </Link>
          ) : (
            <span className="text-xs text-text-subtle">{t("history.unavailable")}</span>
          )}
        </div>
      </div>

      {expanded && kind && item.lessonId && item.day && (
        <div className="border-t border-border px-4 py-2">
          <SessionAttempts lessonId={item.lessonId} mode={kind} day={item.day} />
        </div>
      )}
    </li>
  );
}
