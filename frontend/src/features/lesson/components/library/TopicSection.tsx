import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { TopicRow } from "../../types";
import { localizedName } from "../../utils";
import { LessonGrid } from "../LessonGrid";
import type { PracticeMode } from "../ModeButton";
import SectionHeading from "../SectionHeading";

const PREVIEW_COUNT = 4;

/** Một hàng theo chủ đề: tên, số bài, "Xem tất cả" và 4 bài đầu. `id` là đích cuộn của chip chủ đề (cách trên 140px để không bị thanh dán che). */
export default function TopicSection({ row, mode = "all" }: { row: TopicRow; mode?: PracticeMode | "all" }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("pages");
  const { topic } = row;

  return (
    <div id={`topic-sec-${topic.slug}`} className="scroll-mt-[140px]">
      <SectionHeading
        icon={topic.icon}
        fallbackIcon="library"
        title={localizedName(i18n.language === "en", topic)}
        count={t("student.lessons.topicSec.count", { count: row.totalLessons, defaultValue: `${row.totalLessons} bài` })}
        aside={
          <Button variant="ghost" size="sm" data-go="topic" onClick={() => navigate(`/student/topics/${topic.slug}`)}>
            {t("student.lessons.topicSec.viewAll", "Xem tất cả")}
            <Icon name="arrow-right" className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </Button>
        }
      />
      <LessonGrid lessons={row.lessons.slice(0, PREVIEW_COUNT)} mode={mode} />
    </div>
  );
}
