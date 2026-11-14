import { describe, expect, it } from "vitest";
import { deckActions } from "./deckActions";

describe("deckActions (UC-BT-01 bước 7, BR-BT-01)", () => {
  it("bộ đã xóa hiện ngày xóa, chỉ có Khôi phục và không mở được (AC-BT-04, dương)", () => {
    const result = deckActions({ status: "draft", deletedAt: "2026-11-08T03:00:00Z" }, "teacher");

    expect(result.deletedAt).toBe("2026-11-08T03:00:00Z");
    expect(result.actions).toEqual(["restore"]);
    expect(result.openable).toBe(false);
  });

  it("Admin chỉ có Gỡ xuất bản, không Xóa/Khôi phục (AC-BT-63, âm)", () => {
    const result = deckActions({ status: "published", deletedAt: null }, "admin");

    expect(result.actions).toEqual(["unpublish"]);
    expect(result.actions).not.toContain("delete");
    expect(result.actions).not.toContain("restore");
    expect(result.deletedAt).toBeNull();
    expect(result.openable).toBe(true);
  });

  it("GV: bộ Nháp có Xuất bản, bộ Đã xuất bản có Gỡ xuất bản; bấm dòng mở trang bộ (AC-BT-01, dương)", () => {
    expect(deckActions({ status: "draft" }, "teacher")).toEqual({
      actions: ["publish", "delete"],
      deletedAt: null,
      openable: true,
    });
    expect(deckActions({ status: "published" }, "teacher").actions).toEqual(["unpublish", "delete"]);
  });
});
