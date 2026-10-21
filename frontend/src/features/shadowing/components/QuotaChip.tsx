import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { useQuota } from "@/hooks/useQuota";

/** Chip số lượt shadowing còn lại hôm nay (Free), hoặc "Không giới hạn" (Pro). */
export default function QuotaChip() {
  const { t } = useTranslation("pages");
  const { isPro, remaining, maxActions } = useQuota();
  const k = "student.shadowingPractice";

  if (isPro) {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-warning px-3 text-sm font-semibold text-warning">
        <Icon name="crown" />
        {t(`${k}.quotaUnlimited`)}
      </span>
    );
  }
  if (remaining === null) return null; // chưa tải hạn mức
  const out = remaining <= 0;
  return (
    <span
      title={t(`${k}.quotaTitle`, { limit: maxActions })}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${
        out ? "border-danger text-danger" : "border-border-strong text-text"
      }`}
    >
      <Icon name="zap" />
      {t(`${k}.quotaLeft`, { remaining, limit: maxActions })}
    </span>
  );
}
