import { describe, expect, it } from "vitest";
import {
  DEFAULT_DECK_LIST_FILTER,
  clearDeckFilters,
  deckListState,
  isDeckFilterActive,
} from "./deckListState";

const deck = { id: "d1", name: "TOEIC" };

describe("deckListState (UC-BT-01)", () => {
  it("danh sách trống: GV có nút Tạo bộ thẻ mới, Admin thì không (AC-BT-05, dương)", () => {
    const input = { filter: DEFAULT_DECK_LIST_FILTER, isLoading: false, isError: false, items: [] };

    const teacher = deckListState({ ...input, role: "teacher" });
    const admin = deckListState({ ...input, role: "admin" });

    expect(teacher.kind).toBe("empty");
    expect(teacher.canCreate).toBe(true);
    expect(admin.kind).toBe("empty");
    expect(admin.canCreate).toBe(false);
  });

  it("rỗng khi có bộ lọc: hiện 'Không tìm thấy bộ thẻ phù hợp' và cho xóa bộ lọc (AC-BT-06, dương)", () => {
    const filter = { ...DEFAULT_DECK_LIST_FILTER, q: "xyz123" };

    const state = deckListState({ role: "teacher", filter, isLoading: false, isError: false, items: [] });

    expect(state.kind).toBe("noResult");
    expect(state.canClearFilters).toBe(true);
    expect(state.canCreate).toBe(false);
    const cleared = clearDeckFilters();
    expect(cleared).toEqual(DEFAULT_DECK_LIST_FILTER);
    expect(isDeckFilterActive(cleared)).toBe(false);
    // từ khóa chỉ có khoảng trắng coi như không lọc
    expect(isDeckFilterActive({ ...DEFAULT_DECK_LIST_FILTER, q: "   " })).toBe(false);
    expect(isDeckFilterActive({ ...DEFAULT_DECK_LIST_FILTER, other: true })).toBe(true);
  });

  it("lỗi tải: hiện lỗi + Thử lại, không giữ danh sách cũ (AC-BT-64, dương)", () => {
    const state = deckListState({
      role: "teacher",
      filter: DEFAULT_DECK_LIST_FILTER,
      isLoading: false,
      isError: true,
      items: [deck],
    });

    expect(state.kind).toBe("error");
    expect(state.items).toEqual([]);
    expect(state.canRetry).toBe(true);
  });

  it("có dữ liệu thì hiện danh sách; đang tải thì chưa kết luận trống (AC-BT-01, dương)", () => {
    const filter = DEFAULT_DECK_LIST_FILTER;
    expect(deckListState({ role: "admin", filter, isLoading: false, isError: false, items: [deck] })).toMatchObject({
      kind: "list",
      items: [deck],
    });
    expect(deckListState({ role: "teacher", filter, isLoading: true, isError: false, items: undefined }).kind).toBe(
      "loading",
    );
  });
});
