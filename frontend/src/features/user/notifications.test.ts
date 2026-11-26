import { describe, expect, it, vi } from "vitest";
import {
  groupNotificationsByDate,
  notificationText,
  notificationVisual,
  parseNotificationFilter,
  parsePageIndex,
  relativeTime,
  safeInternalLink,
  type NotificationItem,
} from "./notifications";

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

describe("notificationText (BR-TK-22, AC-TK-74)", () => {
  const base: NotificationItem = { id: "1", message: "Câu dự phòng", read: false, createdAt: "2026-11-26T00:00:00Z" };
  const lookup = (key: string, params: Record<string, string>) =>
    key === "notifications.types.PRO_ACTIVATED" ? `Pro đến ${params.endsAt}` : null;

  it("thông báo cũ không có loại giữ nguyên câu đã lưu", () => {
    expect(notificationText(base, lookup, "vi")).toBe("Câu dự phòng");
  });

  it("thông báo có loại dùng bản dịch và định dạng lại ngày theo giờ Việt Nam", () => {
    const item = { ...base, type: "PRO_ACTIVATED", params: { endsAt: "2026-12-26T17:30:00Z" } };
    // 17:30 UTC đã sang ngày 27 theo giờ Việt Nam
    expect(notificationText(item, lookup, "vi")).toBe(`Pro đến ${new Date("2026-12-26T17:30:00Z").toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`);
    expect(notificationText(item, lookup, "vi")).toContain("27/12/2026");
    expect(notificationText(item, lookup, "en")).toContain("27/12/2026");
  });

  it("loại chưa có bản dịch thì dùng câu dự phòng", () => {
    expect(notificationText({ ...base, type: "SOMETHING_NEW" }, lookup, "en")).toBe("Câu dự phòng");
  });
});

describe("safeInternalLink (AC-TK-74)", () => {
  it("chỉ nhận đường dẫn nội bộ", () => {
    expect(safeInternalLink("/student/subscription")).toBe("/student/subscription");
    expect(safeInternalLink("/student/settings?tab=plan")).toBe("/student/settings?tab=plan");
  });

  it("bỏ đường dẫn ra ngoài hoặc rỗng", () => {
    expect(safeInternalLink("https://evil.example")).toBeNull();
    expect(safeInternalLink("//evil.example")).toBeNull();
    expect(safeInternalLink("/\\evil.example")).toBeNull();
    expect(safeInternalLink("javascript:alert(1)")).toBeNull();
    expect(safeInternalLink("")).toBeNull();
    expect(safeInternalLink(null)).toBeNull();
  });
});

describe("notificationVisual & groupNotificationsByDate", () => {
  it("ánh xạ biểu tượng và nhóm theo loại, loại lạ về mặc định", () => {
    expect(notificationVisual("STREAK_AT_RISK")).toEqual({ icon: "flame", tone: "warning", category: "streak" });
    expect(notificationVisual("PRO_ACTIVATED")).toEqual({ icon: "crown", tone: "success", category: "plan" });
    expect(notificationVisual("UNKNOWN_TYPE")).toEqual({ icon: "bell", tone: "primary", category: "system" });
    expect(notificationVisual(null)).toEqual({ icon: "bell", tone: "primary", category: "system" });
  });

  it("nhóm thông báo theo Hôm nay, Hôm qua, 7 ngày qua và Trước đó", () => {
    const now = new Date(2026, 10, 26, 15, 0, 0).getTime();
    const item = (id: string, date: Date): NotificationItem => ({
      id,
      message: id,
      read: false,
      createdAt: date.toISOString(),
    });
    const list = [
      item("a", new Date(2026, 10, 26, 14, 0, 0)),
      item("b", new Date(2026, 10, 26, 9, 0, 0)),
      item("c", new Date(2026, 10, 25, 20, 0, 0)),
      item("d", new Date(2026, 10, 22, 10, 0, 0)),
      item("e", new Date(2026, 10, 10, 10, 0, 0)),
    ];
    const groups = groupNotificationsByDate(list, now);
    expect(groups.map((g) => [g.group, g.items.map((x) => x.id)])).toEqual([
      ["today", ["a", "b"]],
      ["yesterday", ["c"]],
      ["last7Days", ["d"]],
      ["earlier", ["e"]],
    ]);
  });

  it("chia nhóm theo múi giờ của học viên, không theo trình duyệt", () => {
    const now = Date.parse("2026-11-26T18:00:00Z"); // 01:00 ngày 27 ở Việt Nam, 13:00 ngày 26 ở New York
    const entry: NotificationItem = { id: "x", message: "x", read: false, createdAt: "2026-11-26T16:00:00Z" };
    // Cùng một thời điểm: đã sang hôm qua ở Việt Nam nhưng vẫn là hôm nay ở New York
    expect(groupNotificationsByDate([entry], now, "Asia/Ho_Chi_Minh")[0].group).toBe("yesterday");
    expect(groupNotificationsByDate([entry], now, "America/New_York")[0].group).toBe("today");
    expect(groupNotificationsByDate([{ ...entry, createdAt: "2026-11-26T20:00:00Z" }], Date.parse("2026-11-27T05:00:00Z"), "Asia/Ho_Chi_Minh")[0].group).toBe("today");
    expect(groupNotificationsByDate([{ ...entry, createdAt: "2026-11-26T10:00:00Z" }], Date.parse("2026-11-27T05:00:00Z"), "Asia/Ho_Chi_Minh")[0].group).toBe("yesterday");
    expect(groupNotificationsByDate([{ ...entry, createdAt: "2026-11-19T10:00:00Z" }], now, "America/New_York")[0].group).toBe("last7Days");
    expect(groupNotificationsByDate([{ ...entry, createdAt: "2026-11-18T10:00:00Z" }], now, "America/New_York")[0].group).toBe("earlier");
  });
});
