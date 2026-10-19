import { useTranslation } from "react-i18next";
import { toApiError } from "@/features/auth";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { useAiFeedback } from "../hooks/useAiFeedback";

const K = "student.shadowingPractice.ai";

export interface AiFeedbackCardProps {
  attemptId: number;
  /** Mở hộp mời nâng cấp Pro (gói Free hết lượt nhận xét trong ngày). */
  onUpgrade: () => void;
}

/**
 * Nhận xét AI cho lượt vừa chấm. Xin theo yêu cầu (bấm nút) vì mỗi lần tốn một lượt trong ngày; lượt đã có nhận xét
 * thì server trả lại bản cũ không trừ thêm. Đặt `key={attemptId}` ở nơi dùng để đọc lại câu thì thẻ về trạng thái đầu.
 */
export default function AiFeedbackCard({ attemptId, onUpgrade }: AiFeedbackCardProps) {
  const { t } = useTranslation("pages");
  const { mutate, data, error, isPending, reset, text } = useAiFeedback();
  const code = error ? toApiError(error).code : null;

  return (
    <section aria-live="polite" className="mt-4 rounded-lg border border-border bg-bg-elevated p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary-text">
          <Icon name="sparkles" />
        </span>
        <b className="text-sm">{t(`${K}.title`)}</b>
        {data && data.usage.remaining !== null && data.usage.limit !== null && (
          <span className="rounded-full border border-border-strong px-2 text-[11px] leading-5 text-text-muted">
            {t(`${K}.remaining`, { remaining: data.usage.remaining, limit: data.usage.limit })}
          </span>
        )}
      </div>

      {data ? (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{data.content}</p>
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
              {t(`${K}.retry`)}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="min-w-48 flex-1 text-sm text-text-muted">{t(`${K}.hint`)}</p>
          <Button variant="ghost" size="sm" onClick={() => mutate(attemptId)} leftIcon={<Icon name="wand-sparkles" />}>
            {t(`${K}.ask`)}
          </Button>
        </div>
      )}
    </section>
  );
}
