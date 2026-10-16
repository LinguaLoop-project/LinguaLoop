import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { TopicRow } from "../../types";
import { localizedName } from "../../utils";
import { LessonGrid } from "../LessonGrid";
import SectionHeading from "../SectionHeading";

const PREVIEW_COUNT = 4;

/** Một hàng theo chủ đề: tên, số bài, "Xem tất cả" và 4 bài đầu. `id` là đích cuộn của chip chủ đề. */
export default function TopicSection({ row }: { row: TopicRow }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("pages");
  const { topic } = row;

  return (
    <div id={`topic-sec-${topic.slug}`} className="mb-8 scroll-mt-24">
      <SectionHeading
        icon={topic.icon}
        fallbackIcon="library"
        title={localizedName(i18n.language === "en", topic)}
        count={t("student.lessons.topicSec.count", { count: row.totalLessons, defaultValue: `${row.totalLessons} bài` })}
        aside={
          <Button
            variant="secondary"
            size="sm"
            data-go="topic"
            rightIcon={<Icon name="arrow-right" />}
            onClick={() => navigate(`/student/topics/${topic.slug}`)}
          >
            {t("student.lessons.topicSec.viewAll", "Xem tất cả")}
          </Button>
        }
      />
      <LessonGrid lessons={row.lessons.slice(0, PREVIEW_COUNT)} />
    </div>
  );
}
