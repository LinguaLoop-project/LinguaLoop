import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { useAiEnergy } from "@/hooks/useAiEnergy";

/** Chip số năng lượng AI còn lại hôm nay (Free), hoặc "Không giới hạn" (Pro). */
export default function QuotaChip({ className }: { className?: string }) {
  const { t } = useTranslation("pages");
  const { isPro, remaining, energyLimit } = useAiEnergy();
  const k = "student.shadowingPractice";

  if (isPro) {
    return (
      <span className={`inline-flex h-8 items-center gap-1.5 rounded-full border border-warning px-3 text-sm font-semibold text-warning ${className ?? ""}`}>
        <Icon name="crown" />
        {t(`${k}.quotaUnlimited`)}
      </span>
    );
  }
  if (remaining === null || energyLimit === null) return null;
  const out = remaining <= 0;
  return (
    <span
      title={t(`${k}.quotaTitle`, { limit: energyLimit })}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${
        out ? "border-danger text-danger" : "border-border-strong text-text"
      } ${className ?? ""}`}
    >
      <Icon name="zap" />
      {t(`${k}.quotaLeft`, { remaining, limit: energyLimit })}
    </span>
  );
}
