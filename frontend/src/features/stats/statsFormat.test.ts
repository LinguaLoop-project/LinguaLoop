import { describe, expect, it } from "vitest";
import { featureColor, formatDay, isEmptySeries, niceTicks, sortFeaturesForTable, trendOf } from "./statsFormat";

describe("niceTicks", () => {
  it("chia trục bằng số tròn và phủ giá trị lớn nhất", () => {
    expect(niceTicks(60)).toEqual([0, 20, 40, 60]);
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(niceTicks(1234)).toEqual([0, 500, 1000, 1500]);
  });

  it("vẫn có trục khi mọi giá trị bằng 0 (AC-NK-13)", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });

  it("giá trị nhỏ không sinh vạch lẻ", () => {
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
  });
});

describe("trendOf", () => {
  it("phân biệt tăng, giảm, đứng yên và không tính được (BR-NK-07)", () => {
    expect(trendOf(50)).toBe("up");
    expect(trendOf(-12.5)).toBe("down");
    expect(trendOf(0)).toBe("flat");
    expect(trendOf(null)).toBeNull();
  });
});

describe("isEmptySeries", () => {
  const daily = { days: ["2026-11-10", "2026-11-11"], series: { a: [0, 0], b: [0, 3] } };

  it("trống khi mọi chuỗi được xét đều bằng 0", () => {
    expect(isEmptySeries(daily, ["a"])).toBe(true);
    expect(isEmptySeries(daily)).toBe(false);
  });

  it("chuỗi không có trong số liệu coi như bằng 0", () => {
    expect(isEmptySeries(daily, ["missing"])).toBe(true);
  });
});

describe("formatDay", () => {
  it("đọc ngày theo chuỗi, không lệch múi giờ (AC-NK-15)", () => {
    expect(formatDay("2026-11-10", "vi")).toBe("10/11");
  });
});

describe("bảng tính năng AI", () => {
  const row = (feature: string, uses: number, costVnd: number) => ({ feature, uses, costVnd });

  it("tính năng có dùng xếp trước theo chi phí giảm dần, chưa dùng xuống cuối theo thứ tự cố định", () => {
    const sorted = sortFeaturesForTable([
      row("shadowing_feedback", 0, 0),
      row("lesson_suggest", 8, 14),
      row("tutor_session", 0, 0),
      row("lesson_chat", 3, 14_087),
    ]);
    expect(sorted.map((r) => r.feature)).toEqual(["lesson_chat", "lesson_suggest", "shadowing_feedback", "tutor_session"]);
  });

  it("màu theo tính năng, không theo vị trí trong bảng", () => {
    expect(featureColor("shadowing_feedback")).toBe("--chart-1");
    expect(featureColor("lesson_import")).toBe("--chart-5");
    expect(featureColor("unknown")).toBe("--chart-5");
  });
});
