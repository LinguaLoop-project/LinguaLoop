import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge, { type BadgeTone } from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { buttonClasses } from "@/components/common/buttonStyles";
import type { HistoryItem } from "../types";
import { historyHref, percentOf, practiceKind, scoreBadgeTone } from "../utils";
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
export default function HistoryRow({ item, compactTime = false }: { item: HistoryItem; compactTime?: boolean }) {
  const { t, i18n } = useTranslation("stats");
  const [expanded, setExpanded] = useState(false);
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  const { icon, tone } = visualOf(item);
  const href = historyHref(item);
  const kind = practiceKind(item);
  const dateObj = new Date(item.at);
  const fullWhen = dateObj.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  const when = compactTime ? dateObj.toLocaleTimeString(locale, { timeStyle: "short" }) : fullWhen;

  const title =
    item.title ?? (item.type === "vocab" ? t("history.allDecks") : item.type === "ai" ? t("history.aiLive") : "");
  const facts: string[] = [];
  let highlightBadge: { text: string; tone: BadgeTone } | null = null;

  if (item.type === "practice") {
    facts.push(t("history.sentences", { count: item.sentences ?? 0 }));
    if (item.averageScore !== null) {
      const rounded = Math.round(item.averageScore);
      highlightBadge = {
        text: t("history.average", { score: rounded }),
        tone: scoreBadgeTone(rounded),
      };
    }
    if ((item.retries ?? 0) > 0) facts.push(t("history.retries", { count: item.retries }));
    if ((item.gaveUps ?? 0) > 0) facts.push(t("history.gaveUps", { count: item.gaveUps }));
  } else if (item.type === "vocab") {
    facts.push(item.mode === "learn" ? t("history.vocabLearn") : t("history.vocabReview"));
    const correct = item.correct ?? 0;
    const answered = item.answered ?? 0;
    const acc = percentOf(correct, answered);
    highlightBadge = {
      text: t("history.vocabResult", { correct, answered }),
      tone: answered > 0 ? scoreBadgeTone(acc) : "primary",
    };
  } else {
    facts.push(item.mode === "live" ? t("history.aiLive") : t("history.aiText"));
    highlightBadge = {
      text: t("history.aiResult", { count: item.answered ?? 0 }),
      tone: "primary",
    };
  }

  return (
    <li className="rounded-lg border border-border bg-surface shadow-[var(--shadow-card)] transition-colors hover:border-border-strong">
      <div className="flex flex-wrap items-center gap-3 p-3.5">
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tone}`} aria-hidden="true">
          <Icon name={icon} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold" title={title}>
              {title}
            </span>
            {highlightBadge && <Badge tone={highlightBadge.tone}>{highlightBadge.text}</Badge>}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] text-text-muted">
            <time dateTime={item.at} title={fullWhen}>
              {when}
            </time>
            {facts.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{facts.join(" · ")}</span>
              </>
            )}
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
