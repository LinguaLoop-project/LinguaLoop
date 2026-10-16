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

/** Hàng chip chủ đề kèm số bài; bấm để cuộn tới hàng của chủ đề đó. */
export default function TopicChips({ topics, selected, onSelect }: TopicChipsProps) {
  const { i18n } = useTranslation();
  if (topics.length === 0) return null;
  return (
    <div className="scrollbar-none mb-6 flex max-w-full flex-wrap gap-2 overflow-x-auto pb-1" id="lsTopics">
      {topics.map((topic) => (
        <Chip key={topic.id || topic.slug} active={selected === topic.slug} onClick={() => onSelect(topic.slug)} count={topic.totalLessons}>
          <Icon name={topic.icon} fallback="hash" />
          {localizedName(i18n.language === "en", topic)}
        </Chip>
      ))}
    </div>
  );
}
