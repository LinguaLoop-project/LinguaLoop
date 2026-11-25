import { useTranslation } from "react-i18next";
import SegmentedControl from "@/components/common/SegmentedControl";
import type { StatsRange } from "../types";
import { parseRange, RANGES } from "../utils";

/** Chọn Khoảng thống kê: 7 ngày, 30 ngày hoặc Toàn bộ (BR-TH-03). */
export default function RangeTabs({ value, onChange }: { value: StatsRange; onChange: (range: StatsRange) => void }) {
  const { t } = useTranslation("stats");
  return (
    <SegmentedControl
      ariaLabel={t("range.label")}
      value={value}
      options={RANGES.map((range) => ({ value: range, label: t(`range.${range}`) }))}
      onChange={(next) => onChange(parseRange(next))}
    />
  );
}
