import { DEFAULT_FILTERS, type LibraryFilters } from "./utils";

/** Số bài mỗi trang mà học viên chọn được ở thư viện và trang chủ đề. */
export const LIBRARY_PAGE_SIZES = [12, 24, 36] as const;
export const DEFAULT_PAGE_SIZE = 12;

/** Bài "ngắn" là bài dài tối đa 3 phút; dùng chung cho thư viện, trang chủ đề và Bài đã lưu. */
export const SHORT_MAX_SEC = 180;

/** Đọc bộ lọc từ địa chỉ trang; giá trị lạ về mặc định. `withTopic` false ở trang chủ đề (chủ đề nằm trên đường dẫn). */
export function parseLibraryFilters(params: URLSearchParams, withTopic: boolean): LibraryFilters {
  const level = params.get("level");
  const state = params.get("state");
  const sort = params.get("sort");
  return {
    search: params.get("q") ?? "",
    level: level === "basic" || level === "mid" || level === "adv" ? level : "all",
    state: state === "todo" || state === "doing" || state === "done" ? state : "all",
    topic: withTopic ? (params.get("topic") ?? "all") : "all",
    sort: sort === "new" || sort === "short" ? sort : "pop",
    freeOnly: params.get("free") === "1",
    shortOnly: params.get("short") === "1",
  };
}

/** Đọc trang (đánh số từ 0) và số bài mỗi trang từ địa chỉ; giá trị sai về trang đầu và 12 bài. */
export function parsePaging(params: URLSearchParams): { page: number; pageSize: number } {
  const pageParam = Number.parseInt(params.get("page") ?? "1", 10);
  const sizeParam = Number.parseInt(params.get("size") ?? String(DEFAULT_PAGE_SIZE), 10);
  return {
    page: Number.isFinite(pageParam) && pageParam > 1 ? pageParam - 1 : 0,
    pageSize: (LIBRARY_PAGE_SIZES as readonly number[]).includes(sizeParam) ? sizeParam : DEFAULT_PAGE_SIZE,
  };
}

/** Ghi bộ lọc và phân trang vào địa chỉ; chỉ ghi giá trị khác mặc định để đường dẫn gọn. */
export function buildLibraryParams(
  filters: LibraryFilters,
  page: number,
  pageSize: number,
  withTopic: boolean,
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.search.trim()) p.set("q", filters.search.trim());
  if (filters.level !== DEFAULT_FILTERS.level) p.set("level", filters.level);
  if (filters.state !== DEFAULT_FILTERS.state) p.set("state", filters.state);
  if (withTopic && filters.topic !== DEFAULT_FILTERS.topic) p.set("topic", filters.topic);
  if (filters.sort !== DEFAULT_FILTERS.sort) p.set("sort", filters.sort);
  if (filters.freeOnly) p.set("free", "1");
  if (filters.shortOnly) p.set("short", "1");
  if (page > 0) p.set("page", String(page + 1));
  if (pageSize !== DEFAULT_PAGE_SIZE) p.set("size", String(pageSize));
  return p;
}
