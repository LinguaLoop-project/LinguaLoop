import { useTranslation } from "react-i18next";
import type { StatsRange } from "../types";
import { signedDelta } from "../utils";

/** "+5 so với 7 ngày trước": chênh lệch với khoảng liền trước cùng độ dài (BR-TH-13). */
export default function DeltaBadge({ delta, range }: { delta: number; range: StatsRange }) {
  const { t } = useTranslation("stats");
  const period = t(`range.${range}`);
  return (
    <span className={`text-[13px] font-semibold ${delta > 0 ? "text-success" : "text-text-muted"}`}>
      {delta === 0 ? t("compare.same", { period }) : t("compare.vs", { delta: signedDelta(delta), period })}
    </span>
  );
}
