import { describe, expect, it } from "vitest";
import {
  AUDIT_ACTION_GROUPS,
  auditObjectPath,
  changeLines,
  changeMode,
  DEFAULT_AUDIT_FILTER,
  formatAuditTime,
  hasAuditFilters,
  valueText,
  widerPeriod,
} from "./auditFormat";

describe("bộ lọc nhật ký", () => {
  it("mặc định 7 ngày và chưa lọc gì (BR-NK-04)", () => {
    expect(DEFAULT_AUDIT_FILTER.period).toBe("D7");
    expect(hasAuditFilters(DEFAULT_AUDIT_FILTER)).toBe(false);
    expect(hasAuditFilters({ ...DEFAULT_AUDIT_FILTER, q: "  " })).toBe(false);
    expect(hasAuditFilters({ ...DEFAULT_AUDIT_FILTER, action: "DELETE" })).toBe(true);
  });

  it("gợi ý khoảng rộng hơn khi chưa có nhật ký (AC-NK-05)", () => {
    expect(widerPeriod("D7")).toBe("D30");
    expect(widerPeriod("ALL")).toBeNull();
  });

  it("mỗi hành động thuộc đúng một nhóm", () => {
    const all = AUDIT_ACTION_GROUPS.flatMap((g) => g.actions);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toContain("LOGIN_LOCKED");
  });
});

describe("mở đối tượng (BR-NK-17)", () => {
  it("đường dẫn theo loại đối tượng", () => {
    expect(auditObjectPath({ type: "LESSON", id: "l1" })).toBe("/admin/lessons/l1");
    expect(auditObjectPath({ type: "DECK", id: "d1" })).toBe("/admin/decks/d1");
    expect(auditObjectPath({ type: "USER", id: "u1" })).toBe("/admin/users/u1");
    expect(auditObjectPath({ type: "PLAN", id: "p1" })).toBe("/admin/plans");
    expect(auditObjectPath({ type: "SETTINGS", id: null })).toBe("/admin/credit");
    expect(auditObjectPath({ type: "SENTENCE", id: "s1" })).toBeNull();
  });
});

describe("phần thay đổi (BR-NK-03)", () => {
  it("tạo hiện thông tin lúc tạo, hành động khác hiện trước và sau", () => {
    expect(changeMode("CREATE")).toBe("snapshot");
    expect(changeMode("UPDATE")).toBe("diff");
    expect(changeMode("REJECT")).toBe("diff");
  });

  it("đọc cặp cũ, mới; mục cũ chỉ có giá trị mới vẫn đọc được", () => {
    expect(changeLines({ status: { old: "waiting_teacher", new: "rejected" }, legacy: { new: true }, credits: 10 })).toEqual([
      { field: "status", old: "waiting_teacher", new: "rejected" },
      { field: "legacy", old: null, new: true },
      { field: "credits", old: null, new: 10 },
    ]);
    expect(changeLines(null)).toEqual([]);
  });

  it("giá trị theo trường: mã dịch qua i18n, tiền, số, có/không, trống", () => {
    expect(valueText("status", "rejected")).toEqual({ kind: "code", field: "status", code: "rejected" });
    expect(valueText("priceVnd", 50000)).toEqual({ kind: "money", amount: 50000 });
    expect(valueText("months", 3)).toEqual({ kind: "number", value: 3 });
    expect(valueText("onSale", false)).toEqual({ kind: "no" });
    expect(valueText("title", "")).toEqual({ kind: "empty" });
    expect(valueText("title", "Airport")).toEqual({ kind: "text", text: "Airport" });
  });

  it("thời điểm dạng dd/mm/yyyy hh:mm ở mọi ngôn ngữ", () => {
    const local = new Date(2026, 10, 24, 9, 5);
    expect(formatAuditTime(local.toISOString())).toBe("24/11/2026 09:05");
  });
});
