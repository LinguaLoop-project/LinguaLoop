import { describe, expect, it, vi } from "vitest";
import { parseNotificationFilter, parsePageIndex, relativeTime } from "./notifications";

vi.mock("@/api/axiosClient", () => ({ axiosClient: { get: vi.fn(), post: vi.fn() } }));

describe("relativeTime (BR-TK-16, AC-TK-53)", () => {
  const now = Date.parse("2026-11-16T10:00:00Z");

  it("hiện phút, giờ, ngày trước theo ngôn ngữ", () => {
    expect(relativeTime("2026-11-16T09:55:00Z", "vi", now)).toBe("5 phút trước");
    expect(relativeTime("2026-11-16T08:00:00Z", "en", now)).toBe("2 hours ago");
    expect(relativeTime("2026-11-14T10:00:00Z", "en", now)).toBe("2 days ago");
  });

  it("quá 7 ngày thì hiện ngày", () => {
    expect(relativeTime("2026-11-01T10:00:00Z", "vi", now)).toBe(new Date("2026-11-01T10:00:00Z").toLocaleDateString("vi-VN"));
  });
});

describe("tham số của trang Thông báo (AC-TK-59, AC-TK-60)", () => {
  it("bộ lọc lạ về Tất cả, chỉ nhận unread", () => {
    expect(parseNotificationFilter("unread")).toBe("unread");
    expect(parseNotificationFilter("old")).toBe("all");
    expect(parseNotificationFilter(null)).toBe("all");
  });

  it("trang trên địa chỉ đánh số từ 1 và đổi về chỉ số từ 0", () => {
    expect(parsePageIndex("1")).toBe(0);
    expect(parsePageIndex("3")).toBe(2);
    expect(parsePageIndex("0")).toBe(0);
    expect(parsePageIndex("-2")).toBe(0);
    expect(parsePageIndex("abc")).toBe(0);
    expect(parsePageIndex(null)).toBe(0);
  });
});
