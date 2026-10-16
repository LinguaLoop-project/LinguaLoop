import type { ReactNode } from "react";
import type { LessonSummary } from "../types";
import { LessonCard, LessonCardSkeleton } from "./LessonCard";

/** Lưới thẻ bài dùng chung: bốn cột từ 1280px, một cột trên màn nhỏ. */
const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4";

export function LessonGrid({ lessons, id, className = "" }: { lessons: LessonSummary[]; id?: string; className?: string }): ReactNode {
  return (
    <div id={id} className={`${GRID} ${className}`}>
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
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
