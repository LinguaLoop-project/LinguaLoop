import { describe, expect, it } from "vitest";
import { buildLibraryParams, DEFAULT_PAGE_SIZE, parseLibraryFilters, parsePaging } from "./libraryFilters";
import { DEFAULT_FILTERS } from "./utils";

const params = (query: string) => new URLSearchParams(query);

describe("parseLibraryFilters", () => {
  it("AC_TC_LIB_01 đọc đủ các bộ lọc từ địa chỉ", () => {
    const f = parseLibraryFilters(params("q=cat&level=mid&state=doing&topic=travel&sort=new&free=1&short=1"), true);
    expect(f).toEqual({
      search: "cat",
      level: "mid",
      state: "doing",
      topic: "travel",
      sort: "new",
      freeOnly: true,
      shortOnly: true,
    });
  });

  it("AC_TC_LIB_02 giá trị lạ về mặc định", () => {
    expect(parseLibraryFilters(params("level=zzz&state=zzz&sort=zzz&free=0"), true)).toEqual(DEFAULT_FILTERS);
  });

  it("AC_TC_LIB_03 trang chủ đề bỏ qua tham số topic", () => {
    expect(parseLibraryFilters(params("topic=travel"), false).topic).toBe("all");
  });
});

describe("parsePaging", () => {
  it("AC_TC_LIB_04 trang đánh số từ 1 trên địa chỉ, từ 0 trong code", () => {
    expect(parsePaging(params("page=3&size=24"))).toEqual({ page: 2, pageSize: 24 });
  });

  it("AC_TC_LIB_05 trang hoặc cỡ trang sai về trang đầu và 12 bài", () => {
    expect(parsePaging(params("page=abc&size=7"))).toEqual({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
    expect(parsePaging(params("page=-2"))).toEqual({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
    expect(parsePaging(params(""))).toEqual({ page: 0, pageSize: DEFAULT_PAGE_SIZE });
  });
});

describe("buildLibraryParams", () => {
  it("AC_TC_LIB_06 bộ lọc mặc định cho địa chỉ trống", () => {
    expect(buildLibraryParams(DEFAULT_FILTERS, 0, DEFAULT_PAGE_SIZE, true).toString()).toBe("");
  });

  it("AC_TC_LIB_07 chỉ ghi giá trị khác mặc định và cắt khoảng trắng ô tìm", () => {
    const p = buildLibraryParams(
      { ...DEFAULT_FILTERS, search: "  cat ", level: "adv", topic: "travel", freeOnly: true },
      1,
      24,
      true,
    );
    expect(p.get("q")).toBe("cat");
    expect(p.get("level")).toBe("adv");
    expect(p.get("topic")).toBe("travel");
    expect(p.get("free")).toBe("1");
    expect(p.get("page")).toBe("2");
    expect(p.get("size")).toBe("24");
    expect(p.has("state")).toBe(false);
  });

  it("AC_TC_LIB_08 trang chủ đề không ghi topic", () => {
    expect(buildLibraryParams({ ...DEFAULT_FILTERS, topic: "travel" }, 0, DEFAULT_PAGE_SIZE, false).has("topic")).toBe(false);
  });

  it("AC_TC_LIB_09 ghi rồi đọc lại ra đúng bộ lọc", () => {
    const filters = { ...DEFAULT_FILTERS, search: "dog", state: "done", sort: "short", shortOnly: true };
    const back = parseLibraryFilters(buildLibraryParams(filters, 4, 36, true), true);
    expect(back).toEqual(filters);
    expect(parsePaging(buildLibraryParams(filters, 4, 36, true))).toEqual({ page: 4, pageSize: 36 });
  });
});
