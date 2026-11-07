import type { DeckCategory, DeckPart, DeckProgress, DeckSummary, SavedWord, SavedWordSource } from "./types";

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

/** Đường dẫn trang một bộ. */
export const deckUrl = (slug: string) => `/student/vocab/${encodeURIComponent(slug)}`;

/** Đường dẫn học một phần; số phần trên đường dẫn tính từ 1 cho dễ đọc, còn `index` của API tính từ 0. */
export const partUrl = (slug: string, index: number) => `${deckUrl(slug)}/parts/${index + 1}`;

/** Số thẻ đã học (không còn Mới) trong một bộ. */
export const learnedCount = (progress: DeckProgress) => progress.mastered + progress.reviewing + progress.learning;

/** Phần trăm làm tròn của `value` trên `total`; 0 khi `total` bằng 0. */
export const percentOf = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

/** Bộ đã học ít nhất một thẻ thì hiện ở mục "Đang học". */
export const isStarted = (deck: DeckSummary) => learnedCount(deck.progress) > 0;

export type DeckStateFilter = "all" | "learning" | "new";

export interface DeckFilter {
  query: string;
  /** `slug` của danh mục, hoặc "all". */
  category: string;
  state: DeckStateFilter;
  /** Mức CEFR, hoặc "all". */
  level: string;
}

export const EMPTY_DECK_FILTER: DeckFilter = { query: "", category: "all", state: "all", level: "all" };

/** Chữ thường, bỏ dấu và khoảng trắng hai đầu, để gõ "thong dung" vẫn tìm ra "Thông Dụng". */
export const foldText = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().trim();

/** Có điều kiện lọc nào đang bật không. */
export const isDeckFilterActive = (filter: DeckFilter) =>
  filter.query.trim() !== "" || filter.category !== "all" || filter.state !== "all" || filter.level !== "all";

/** Lọc đồng thời theo chữ tìm (tên bộ hoặc tên danh mục, có dấu hay không), danh mục, tình trạng học và mức CEFR. */
export function filterDecks(decks: DeckSummary[], filter: DeckFilter): DeckSummary[] {
  const query = foldText(filter.query);
  return decks.filter((deck) => {
    if (filter.category !== "all" && deck.category?.slug !== filter.category) return false;
    if (filter.level !== "all" && deck.cefrLevel !== filter.level) return false;
    if (filter.state === "learning" && !isStarted(deck)) return false;
    if (filter.state === "new" && isStarted(deck)) return false;
    if (!query) return true;
    const haystack = [deck.name, deck.nameVi, deck.category?.name, deck.category?.nameVi].filter(Boolean).join(" ");
    return foldText(haystack).includes(query);
  });
}

/** Các bộ gom theo danh mục, giữ thứ tự API trả về (danh mục theo thứ tự xuất hiện đầu tiên); bộ không có danh mục xếp cuối. */
export function groupByCategory(decks: DeckSummary[]): { category: DeckCategory | null; decks: DeckSummary[] }[] {
  const groups = new Map<string, { category: DeckCategory | null; decks: DeckSummary[] }>();
  for (const deck of decks) {
    const key = deck.category?.slug ?? "";
    const group = groups.get(key) ?? { category: deck.category, decks: [] };
    group.decks.push(deck);
    groups.set(key, group);
  }
  const all = [...groups.values()];
  return [...all.filter((group) => group.category), ...all.filter((group) => !group.category)];
}

/** Phần đầu tiên còn thẻ Mới và học được: nơi "Học từ mới" mở; null khi mọi phần mở được đã học xong. */
export function nextPartIndex(parts: DeckPart[]): number | null {
  const next = parts.find((part) => !part.locked && part.studiedCount < part.cardCount);
  return next ? next.index : null;
}

export type PartState = "done" | "current" | "locked" | "todo";

/** Trạng thái hiển thị của một phần trong danh sách phần của bộ. */
export function partState(part: DeckPart, nextIndex: number | null): PartState {
  if (part.locked) return "locked";
  if (part.cardCount > 0 && part.studiedCount >= part.cardCount) return "done";
  return part.index === nextIndex ? "current" : "todo";
}

/** Số phần hiện mặc định trong trang bộ. */
export const PART_WINDOW = 8;

/**
 * Các phần để hiện: bộ có hàng trăm phần thì chỉ hiện một cửa sổ quanh phần đang học (hoặc phần khoá đầu tiên khi không
 * còn phần nào để học), trừ khi người học chọn xem tất cả. `from` và `to` là vị trí đầu và cuối (không gồm) của cửa sổ.
 */
export function visibleParts(
  parts: DeckPart[],
  next: number | null,
  showAll: boolean,
  size = PART_WINDOW,
): { items: DeckPart[]; from: number; to: number } {
  if (showAll || parts.length <= size) return { items: parts, from: 0, to: parts.length };
  const firstLocked = parts.findIndex((part) => part.locked);
  const anchor = next ?? Math.max(firstLocked, 0);
  const from = Math.max(0, Math.min(anchor - 2, parts.length - size));
  return { items: parts.slice(from, from + size), from, to: from + size };
}
