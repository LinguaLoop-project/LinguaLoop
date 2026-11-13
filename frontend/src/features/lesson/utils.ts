import type { LessonDetail } from "./types";

/** Nhóm trình độ ở thanh lọc → tham số `cefrLevel` của GET /lessons. */
export function cefrLevelParam(level: string): string | undefined {
  if (level === "basic") return "A1,A2";
  if (level === "mid") return "B1,B2";
  if (level === "adv") return "C1,C2";
  return undefined;
}

/** Cách sắp xếp ở thanh lọc → tham số `sort`. */
export function sortParam(sort: string): string | undefined {
  if (sort === "pop") return "viewCount,desc";
  if (sort === "new") return "createdAt,desc";
  if (sort === "short") return "durationSec,asc";
  return undefined;
}

/** Tên hiển thị theo ngôn ngữ đang chọn; thiếu bản của ngôn ngữ đó thì dùng bản còn lại. */
export function localizedName(
  isEn: boolean,
  item: { name?: string | null; nameVi?: string | null } | null | undefined,
  fallback = "",
): string {
  if (!item) return fallback;
  return (isEn ? item.name || item.nameVi : item.nameVi || item.name) || fallback;
}

export interface LibraryFilters {
  search: string;
  level: string;
  sort: string;
  freeOnly: boolean;
}

export const DEFAULT_FILTERS: LibraryFilters = { search: "", level: "all", sort: "pop", freeOnly: false };

/** Có bộ lọc nào khác mặc định không (khi đó trang hiện lưới kết quả thay cho các hàng theo chủ đề). */
export function isFiltered(f: LibraryFilters): boolean {
  return Boolean(f.search.trim()) || f.level !== "all" || f.freeOnly || f.sort !== "pop";
}

/** Mọi bài là video YouTube; dựng link xem và link nhúng từ `youtubeId`. */
export function resolveMedia(lesson: Pick<LessonDetail, "youtubeId">) {
  const rawUrl = `https://www.youtube.com/watch?v=${lesson.youtubeId}`;
  const embedUrl = `https://www.youtube.com/embed/${lesson.youtubeId}?autoplay=1&rel=0`;
  return { rawUrl, isYouTube: true, embedUrl };
}
