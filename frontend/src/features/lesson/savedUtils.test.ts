import { describe, expect, it } from "vitest";
import { formatTotalMinutes, lessonStateOf, nextMode, savedAgo } from "./savedUtils";

const progress = (dictationPercent: number, shadowingPercent: number) => ({ dictationPercent, shadowingPercent });

describe("nextMode", () => {
  it("AC_TC_SV_01 gợi ý chế độ làm ít hơn, bằng nhau thì nghe chép", () => {
    expect(nextMode(progress(80, 20))).toBe("shadowing");
    expect(nextMode(progress(20, 80))).toBe("dictation");
    expect(nextMode(progress(0, 0))).toBe("dictation");
    expect(nextMode(progress(100, 100))).toBe("dictation");
  });
});

describe("lessonStateOf", () => {
  it("AC_TC_SV_02 suy ra trạng thái từ phần trăm hai chế độ", () => {
    expect(lessonStateOf(progress(0, 0))).toBe("todo");
    expect(lessonStateOf(progress(0, 10))).toBe("doing");
    expect(lessonStateOf(progress(100, 99))).toBe("doing");
    expect(lessonStateOf(progress(100, 100))).toBe("done");
  });
});

describe("formatTotalMinutes", () => {
  it("AC_TC_SV_03 hiện phút, giờ và giờ phút theo ngôn ngữ", () => {
    expect(formatTotalMinutes(24 * 60, "vi")).toBe("24 phút");
    expect(formatTotalMinutes(72 * 60, "vi")).toBe("1 giờ 12 phút");
    expect(formatTotalMinutes(120 * 60, "vi")).toBe("2 giờ");
    expect(formatTotalMinutes(24 * 60, "en")).toBe("24 min");
    expect(formatTotalMinutes(72 * 60, "en")).toBe("1h 12m");
    expect(formatTotalMinutes(120 * 60, "en")).toBe("2h");
  });

  it("AC_TC_SV_04 tổng thời lượng nhỏ vẫn hiện tối thiểu 1 phút", () => {
    expect(formatTotalMinutes(0, "vi")).toBe("1 phút");
    expect(formatTotalMinutes(20, "en")).toBe("1 min");
  });
});

describe("savedAgo", () => {
  const now = new Date("2026-11-23T12:00:00Z");

  it("AC_TC_SV_05 dưới một phút là vừa xong, còn lại theo ngày, giờ, phút", () => {
    expect(savedAgo("2026-11-23T11:59:40Z", now, "en")).toBe("now");
    expect(savedAgo("2026-11-23T11:30:00Z", now, "en")).toBe("30 minutes ago");
    expect(savedAgo("2026-11-23T09:00:00Z", now, "en")).toBe("3 hours ago");
    expect(savedAgo("2026-11-20T12:00:00Z", now, "en")).toBe("3 days ago");
  });
});
