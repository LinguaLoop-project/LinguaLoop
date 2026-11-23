import { useTranslation } from "react-i18next";
import { toApiError } from "@/features/auth";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import CreditCost from "@/features/subscription/components/CreditCost";
import { AI_ACTION_FEEDBACK } from "@/features/subscription/types";
import { parseFeedback } from "../feedback";
import type { StructuredFeedback } from "../feedback";
import { useAiFeedback } from "../hooks/useAiFeedback";

const K = "student.shadowingPractice.ai";

export interface AiFeedbackCardProps {
  attemptId: number;
  /** Nhận xét AI đã lưu của lượt này (mở lại bài), hiện sẵn không cần xin lại. */
  saved?: string | null;
  /** Mở hộp mời nâng cấp Pro (gói Free hết lượt nhận xét trong ngày). */
  onUpgrade: () => void;
  /** Bấm một từ trong nhận xét: mở chi tiết từ đó (nghe mẫu, từng âm) ở lượt này. */
  onSelectWord?: (word: string) => void;
  /** Bước tiếp theo "Luyện với gia sư". */
  onAskTutor?: () => void;
}

/** Chip từ hoặc âm trong nhận xét; từ bấm được để xem chi tiết. */
function Chip({ children, onClick }: { children: string; onClick?: () => void }) {
  const base = "rounded-full border border-border-strong px-2.5 py-0.5 text-[13px] font-semibold";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} cursor-pointer bg-surface hover:border-primary hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
      {children}
    </button>
  ) : (
    <span className={`${base} bg-surface text-text-muted`}>{children}</span>
  );
}

/** Nhận xét có cấu trúc: tổng quan, điểm mạnh, tối đa 3 lỗi ưu tiên kèm mẹo, từ bị bỏ sót và một bước tiếp theo. */
function StructuredBody({
  feedback,
  onSelectWord,
  onAskTutor,
}: {
  feedback: StructuredFeedback;
  onSelectWord?: (word: string) => void;
  onAskTutor?: () => void;
}) {
  const { t } = useTranslation("pages");
  const { next } = feedback;
  return (
    <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed">
      <p>{feedback.summary}</p>

      {feedback.strengths.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label={t(`${K}.strengths`)}>
          {feedback.strengths.map((text) => (
            <li key={text} className="flex items-start gap-2">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success" />
              {text}
            </li>
          ))}
        </ul>
      )}

      {feedback.issues.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t(`${K}.focus`)}</p>
          {feedback.issues.map((issue) => (
            <div key={issue.words.join("|") + issue.problem} className="rounded-md border border-border border-l-[3px] border-l-warning bg-surface p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {issue.words.map((word) => (
                  <Chip key={word} onClick={onSelectWord ? () => onSelectWord(word) : undefined}>
                    {word}
                  </Chip>
                ))}
                {issue.phonemes.map((phoneme) => (
                  <span key={phoneme} className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[13px] text-text-muted">
                    {`/${phoneme}/`}
                  </span>
                ))}
              </div>
              <p className="mt-1.5">{issue.problem}</p>
              {issue.tips.map((tip) => (
                <p key={tip.phoneme} className="mt-1.5 flex gap-2 text-[13px] text-text-muted">
                  <Icon name="lightbulb" className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    <b>{t(`${K}.howToFix`, { phoneme: tip.phoneme })}: </b>
                    {tip.text}
                  </span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {feedback.omitted.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] text-text-muted">{t(`${K}.omitted`)}</span>
          {feedback.omitted.map((word) => (
            <Chip key={word} onClick={onSelectWord ? () => onSelectWord(word) : undefined}>
              {word}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <Icon name="target" className="size-4 shrink-0 text-primary-text" />
        <p className="min-w-48 flex-1 text-[13px]">{t(`${K}.next.${next.action}`, { word: next.word ?? "" })}</p>
        {next.action === "listen_word" && next.word && onSelectWord && (
          <Button variant="ghost" size="sm" onClick={() => onSelectWord(next.word as string)} leftIcon={<Icon name="volume-2" />}>
            {t(`${K}.next.listenCta`, { word: next.word })}
          </Button>
        )}
        {next.action === "ask_tutor" && onAskTutor && (
          <Button variant="ghost" size="sm" onClick={onAskTutor} leftIcon={<Icon name="bot" />}>
            {t(`${K}.next.tutorCta`)}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Nhận xét AI cho lượt vừa chấm. Xin theo yêu cầu (bấm nút) vì mỗi lần tốn một lượt trong ngày; lượt đã có nhận xét
 * thì server trả lại bản cũ không trừ thêm. Đặt `key={attemptId}` ở nơi dùng để đọc lại câu thì thẻ về trạng thái đầu.
 */
export default function AiFeedbackCard({ attemptId, saved, onUpgrade, onSelectWord, onAskTutor }: AiFeedbackCardProps) {
  const { t } = useTranslation("pages");
  const { mutate, data, error, isPending, reset, text } = useAiFeedback();
  const code = error ? toApiError(error).code : null;
  const content = data?.content ?? saved ?? null;
  const structured = parseFeedback(content);

  return (
    <section aria-live="polite" className="mt-4 rounded-lg border border-border bg-bg-elevated p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary-text">
          <Icon name="sparkles" />
        </span>
        <b className="text-sm">{t(`${K}.title`)}</b>
        {data?.credit && data.credit.kind !== "staff" && (
          <span className="rounded-full border border-border-strong px-2 text-[11px] leading-5 text-text-muted">
            {t(`${K}.remaining`, { remaining: data.credit.balance })}
          </span>
        )}
      </div>

      {content ? (
        structured ? (
          <StructuredBody feedback={structured} onSelectWord={onSelectWord} onAskTutor={onAskTutor} />
        ) : (
          // Nhận xét cũ là văn xuôi: hiện nguyên văn
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{content}</p>
        )
      ) : isPending && text ? (
        // Chữ chạy ra ngay khi AI viết; con trỏ nhấp nháy cho biết còn đang viết
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
          {text}
          <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-text" />
        </p>
      ) : isPending ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-text-muted">
          <Icon name="loader-circle" className="animate-spin" />
          {t(`${K}.writing`)}
        </p>
      ) : code === "QUOTA_EXCEEDED" ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="min-w-48 flex-1 text-sm text-text-muted">{t(`${K}.quotaOut`)}</p>
          <Button size="sm" onClick={onUpgrade}>
            {t(`${K}.upgrade`)}
          </Button>
        </div>
      ) : error ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="min-w-48 flex-1 text-sm text-text-muted">
            {code === "AI_CONSENT_REQUIRED"
              ? t(`${K}.consent`)
              : code === "AI_FEEDBACK_BUSY"
                ? t(`${K}.busy`)
                : t(`${K}.failed`)}
          </p>
          {code !== "AI_CONSENT_REQUIRED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                mutate(attemptId);
              }}
              leftIcon={<Icon name="rotate-cw" />}
            >
              {t(`${K}.retry`)} <CreditCost action={AI_ACTION_FEEDBACK} />
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="min-w-48 flex-1 text-sm text-text-muted">{t(`${K}.hint`)}</p>
          <Button variant="ghost" size="sm" onClick={() => mutate(attemptId)} leftIcon={<Icon name="wand-sparkles" />}>
            {t(`${K}.ask`)} <CreditCost action={AI_ACTION_FEEDBACK} />
          </Button>
        </div>
      )}
    </section>
  );
}
