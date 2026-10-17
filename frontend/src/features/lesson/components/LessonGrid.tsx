import type { ReactNode } from "react";
import type { LessonSummary } from "../types";
import { LessonCard, LessonCardSkeleton } from "./LessonCard";
import type { PracticeMode } from "./ModeButton";

/** `.l-grid` của mockup: tự chia cột, mỗi thẻ rộng tối thiểu 290px, khoảng cách 20px. */
const GRID = "grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-5";

export function LessonGrid({ lessons, id, className = "", mode = "all" }: { lessons: LessonSummary[]; id?: string; className?: string; mode?: PracticeMode | "all" }): ReactNode {
  return (
    <div id={id} className={`${GRID} ${className}`}>
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} mode={mode} />
      ))}
    </div>
  );
}

/** Lưới skeleton đang tải; `aria-busy` để trình đọc màn hình biết vùng này chưa xong. */
export function LessonGridSkeleton({ count = 8 }: { count?: number }): ReactNode {
  return (
    <div className={GRID} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <LessonCardSkeleton key={i} />
      ))}
    </div>
  );
}
