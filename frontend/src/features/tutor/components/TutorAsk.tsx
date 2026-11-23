import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Mascot from "@/components/common/Mascot";

const K = "student.tutor.ask";

export interface TutorAskProps {
  onEnable: () => void;
  onDecline: () => void;
  /** Credit một phiên gia sư (BR-GA-06); undefined khi chưa tải xong giá. */
  cost: number | undefined;
}

/** Hỏi bật gia sư một lần mỗi bài, trước câu đầu tiên. */
export default function TutorAsk({ onEnable, onDecline, cost }: TutorAskProps) {
  const { t } = useTranslation("pages");
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-lg border border-primary/50 bg-primary-soft p-4">
      <Mascot mood="hello" size={72} alt="" className="hidden sm:block" />
      <div className="min-w-56 flex-1">
        <b className="font-display text-lg">{t(`${K}.title`)}</b>
        <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-text-muted">{t(`${K}.body`)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={onEnable}>
            {t(`${K}.enable`)}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDecline}>
            {t(`${K}.decline`)}
          </Button>
          {cost !== undefined && <span className="text-sm text-text-subtle">{t(`${K}.costNote`, { cost })}</span>}
        </div>
      </div>
    </div>
  );
}
