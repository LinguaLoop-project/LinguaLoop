import { describe, expect, it, vi } from "vitest";
import { relativeTime } from "./notifications";

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
