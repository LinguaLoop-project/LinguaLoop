import { describe, expect, it } from "vitest";
import { cefrLevelParam, DEFAULT_FILTERS, isFiltered, localizedName, sortParam } from "./utils";

describe("cefrLevelParam", () => {
  it("AC_TC_LIB_10 đổi nhóm trình độ thành danh sách CEFR", () => {
    expect(cefrLevelParam("basic")).toBe("A1,A2");
    expect(cefrLevelParam("mid")).toBe("B1,B2");
    expect(cefrLevelParam("adv")).toBe("C1,C2");
    expect(cefrLevelParam("all")).toBeUndefined();
  });
});

describe("sortParam", () => {
  it("AC_TC_LIB_11 đổi cách sắp xếp thành tham số sort", () => {
    expect(sortParam("pop")).toBe("viewCount,desc");
    expect(sortParam("new")).toBe("createdAt,desc");
    expect(sortParam("short")).toBe("durationSec,asc");
    expect(sortParam("khác")).toBeUndefined();
  });
});

describe("isFiltered", () => {
  it("AC_TC_LIB_12 bộ lọc mặc định chưa lọc", () => {
    expect(isFiltered(DEFAULT_FILTERS)).toBe(false);
    expect(isFiltered({ ...DEFAULT_FILTERS, search: "   " })).toBe(false);
  });

  it("AC_TC_LIB_13 mỗi bộ lọc khác mặc định đều tính là đang lọc", () => {
    for (const patch of [
      { search: "a" },
      { level: "mid" },
      { state: "todo" },
      { topic: "travel" },
      { freeOnly: true },
      { shortOnly: true },
      { sort: "new" },
    ]) {
      expect(isFiltered({ ...DEFAULT_FILTERS, ...patch })).toBe(true);
    }
  });
});

describe("localizedName", () => {
  const topic = { name: "Travel", nameVi: "Du lịch" };

  it("AC_TC_LIB_14 chọn tên theo ngôn ngữ, thiếu thì dùng bản còn lại", () => {
    expect(localizedName(true, topic)).toBe("Travel");
    expect(localizedName(false, topic)).toBe("Du lịch");
    expect(localizedName(true, { nameVi: "Du lịch" })).toBe("Du lịch");
    expect(localizedName(false, { name: "Travel" })).toBe("Travel");
  });

  it("AC_TC_LIB_15 không có dữ liệu thì dùng giá trị dự phòng", () => {
    expect(localizedName(false, null, "slug")).toBe("slug");
    expect(localizedName(false, { name: null, nameVi: null }, "slug")).toBe("slug");
  });
});
