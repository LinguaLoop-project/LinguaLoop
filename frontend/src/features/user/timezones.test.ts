import { describe, expect, it } from "vitest";
import { formatTimezoneName, formatTimezoneOffset, formatTimezoneTime, timezoneOptions } from "./timezones";

const NOON_UTC = new Date("2026-06-01T12:00:00Z");

describe("formatTimezoneName (AC-TK-65)", () => {
  it("đổi múi giờ IANA thành tên dễ đọc", () => {
    expect(formatTimezoneName("Asia/Ho_Chi_Minh")).toBe("Ho Chi Minh (Asia)");
    expect(formatTimezoneName("America/Argentina/Buenos_Aires")).toBe("Argentina / Buenos Aires (America)");
  });

  it("múi giờ không có vùng thì giữ nguyên", () => {
    expect(formatTimezoneName("UTC")).toBe("UTC");
  });
});

describe("formatTimezoneOffset và formatTimezoneTime (AC-TK-65)", () => {
  it("độ lệch UTC dạng UTC+07:00, múi giờ UTC là UTC+00:00", () => {
    expect(formatTimezoneOffset("Asia/Ho_Chi_Minh", NOON_UTC)).toBe("UTC+07:00");
    expect(formatTimezoneOffset("UTC", NOON_UTC)).toBe("UTC+00:00");
  });

  it("giờ địa phương dạng 19:00", () => {
    expect(formatTimezoneTime("Asia/Ho_Chi_Minh", NOON_UTC)).toBe("19:00");
  });

  it("múi giờ không hợp lệ trả chuỗi rỗng thay vì lỗi", () => {
    expect(formatTimezoneOffset("Not/AZone", NOON_UTC)).toBe("");
    expect(formatTimezoneTime("Not/AZone", NOON_UTC)).toBe("");
  });
});

describe("timezoneOptions", () => {
  it("luôn giữ giá trị đang lưu trong danh sách", () => {
    expect(timezoneOptions("Asia/Ho_Chi_Minh")).toContain("Asia/Ho_Chi_Minh");
  });
});
