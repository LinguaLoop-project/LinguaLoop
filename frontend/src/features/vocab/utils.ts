import type { SavedWord, SavedWordSource } from "./types";

export type SourceFilter = "all" | Exclude<SavedWordSource, "manual">;
/** Đang học gồm thẻ Mới, Đang học và Đang ôn (mọi thẻ chưa thuộc). */
export type StateFilter = "all" | "due" | "learning" | "mastered";

export interface SavedWordFilter {
  query: string;
  source: SourceFilter;
  state: StateFilter;
}

export const EMPTY_FILTER: SavedWordFilter = { query: "", source: "all", state: "all" };

/** Nghĩa đã lưu của một mục từ, để hiện "Đã lưu" ở hộp tra từ. */
export const findSaved = (items: SavedWord[] | undefined, headword: string, meaningNo: number): SavedWord | undefined =>
  items?.find((item) => item.headword === headword && item.meaningNo === meaningNo);

/** Lọc đồng thời theo chữ tìm (từ hoặc nghĩa), nguồn và trạng thái (UC-VOCAB-02). */
export function filterSavedWords(items: SavedWord[], filter: SavedWordFilter): SavedWord[] {
  const query = filter.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter.source !== "all" && item.source !== filter.source) return false;
    if (filter.state === "due" && !item.due) return false;
    if (filter.state === "learning" && item.status === "mastered") return false;
    if (filter.state === "mastered" && item.status !== "mastered") return false;
    if (!query) return true;
    return `${item.headword} ${item.translationVi ?? ""}`.toLowerCase().includes(query);
  });
}

export interface SavedWordStats {
  total: number;
  due: number;
  learning: number;
  mastered: number;
}

export function savedWordStats(items: SavedWord[]): SavedWordStats {
  const mastered = items.filter((item) => item.status === "mastered").length;
  return {
    total: items.length,
    due: items.filter((item) => item.due).length,
    learning: items.length - mastered,
    mastered,
  };
}
