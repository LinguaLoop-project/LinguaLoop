import { useTranslation } from "react-i18next";
import Chip from "@/components/common/Chip";
import Icon from "@/components/common/Icon";
import type { TopicResponse } from "../../types";
import { localizedName } from "../../utils";

export interface TopicChipsProps {
  topics: TopicResponse[];
  selected: string;
  onSelect: (slug: string) => void;
}

/** Hàng chip chủ đề dán dưới thanh trên (`.chips-row.sticky`): bấm để nhảy tới hàng của chủ đề, cuộn tới đâu chip sáng tới đó. */
export default function TopicChips({ topics, selected, onSelect }: TopicChipsProps) {
  const { t, i18n } = useTranslation("pages");
  if (topics.length === 0) return null;
  return (
    <div
      id="lsTopics"
      aria-label={t("student.lessons.jumpTo", "Chuyển nhanh tới chủ đề")}
      className="sticky top-16 z-[15] mb-2 flex gap-2 overflow-x-auto border-b border-border bg-[color-mix(in_srgb,var(--bg-base)_92%,transparent)] py-2.5 backdrop-blur-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Chip active={selected === "all"} onClick={() => onSelect("all")}>
        <Icon name="layout-grid" className="text-xl" />
        {t("student.lessons.toolbar.levels.all", "Tất cả")}
      </Chip>
      {topics.map((topic) => (
        <Chip key={topic.id || topic.slug} active={selected === topic.slug} onClick={() => onSelect(topic.slug)} count={topic.totalLessons}>
          <Icon name={topic.icon} fallback="hash" className="text-xl" />
          {localizedName(i18n.language === "en", topic)}
        </Chip>
      ))}
    </div>
  );
}
