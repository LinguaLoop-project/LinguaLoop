import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { useAiEnergy } from "@/hooks/useAiEnergy";

/**
 * Chip số credit AI còn lại: credit dùng thử với gói Free (BR-GA-03), credit tháng kèm ngày làm mới với gói Pro
 * (BR-GA-10).
 */
export default function QuotaChip({ className }: Readonly<{ className?: string }>) {
  const { t, i18n } = useTranslation("pages");
  const { isPro, remaining, resetsAt } = useAiEnergy();
  const k = "student.shadowingPractice";

  if (remaining === null) return null;
  const out = remaining <= 0;
  const date = resetsAt ? new Date(resetsAt).toLocaleDateString(i18n.language) : null;
  return (
    <span
      title={date ? t(`${k}.quotaTitlePro`, { date }) : t(`${k}.quotaTitleTrial`)}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${
        out ? "border-danger text-danger" : isPro ? "border-warning text-warning" : "border-border-strong text-text"
      } ${className ?? ""}`}
    >
      <Icon name={isPro ? "crown" : "zap"} />
      {t(`${k}.quotaLeft`, { remaining })}
    </span>
  );
}
