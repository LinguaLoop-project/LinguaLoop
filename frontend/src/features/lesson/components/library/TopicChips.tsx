import { useEffect, useRef, useState } from "react";
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

/** Rút gọn tên chủ đề dài: lấy phần trước dấu ":" hoặc " - " (tên đầy đủ nằm ở title và ở tiêu đề hàng). */
const shortName = (name: string) => name.split(/\s*[:|]\s*|\s+[-–—]\s+/)[0] || name;

/** Hàng chip chủ đề dán dưới thanh trên (`.chips-row.sticky`): tên ngắn gọn, kéo chuột hoặc vuốt để trượt ngang (có thanh cuộn mảnh), cuộn tới đâu chip sáng tới đó. */
export default function TopicChips({ topics, selected, onSelect }: TopicChipsProps) {
  const { t, i18n } = useTranslation("pages");
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 });
  const [dragging, setDragging] = useState(false);

  // Lăn bánh xe chuột trên hàng chip thì trượt ngang; tới mép thì trả lại cho trang cuộn dọc. Cần listener không-thụ-động để chặn cuộn dọc.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const next = el.scrollLeft + e.deltaY;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max)) return;
      e.preventDefault();
      el.scrollLeft = Math.max(0, Math.min(max, next));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [topics.length]);

  if (topics.length === 0) return null;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !rowRef.current) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: rowRef.current.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !rowRef.current) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) rowRef.current.scrollLeft = d.startLeft - dx;
  };
  const endDrag = () => {
    drag.current.active = false;
    setDragging(false);
  };

  return (
    <div className="sticky top-16 z-[15] mb-2 border-b border-border bg-[color-mix(in_srgb,var(--bg-base)_92%,transparent)] backdrop-blur-[10px]">
      <div
        ref={rowRef}
        id="lsTopics"
        aria-label={t("student.lessons.jumpTo", "Chuyển nhanh tới chủ đề")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.stopPropagation();
            e.preventDefault();
            drag.current.moved = false;
          }
        }}
        className={`flex select-none gap-2 overflow-x-auto pb-2.5 pt-2.5 [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin] ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <Chip active={selected === "all"} onClick={() => onSelect("all")}>
          <Icon name="layout-grid" className="text-xl" />
          {t("student.lessons.toolbar.levels.all", "Tất cả")}
        </Chip>
        {topics.map((topic) => {
          const full = localizedName(i18n.language === "en", topic);
          return (
            <Chip key={topic.id || topic.slug} active={selected === topic.slug} onClick={() => onSelect(topic.slug)} count={topic.totalLessons} title={full}>
              <Icon name={topic.icon} fallback="hash" className="text-xl" />
              <span className="max-w-[160px] truncate">{shortName(full)}</span>
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
