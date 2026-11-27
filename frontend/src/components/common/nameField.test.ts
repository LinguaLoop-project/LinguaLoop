import { describe, expect, it } from "vitest";
import { CATALOG_NAME_MAX, validateName } from "./nameField";

describe("validateName (BR-CD-01, BR-CD-02)", () => {
  it("bắt buộc nhập tên, khoảng trắng không tính (AC-CD-07, 12, 21, 26)", () => {
    expect(validateName("")).toBe("required");
    expect(validateName("   ")).toBe("required");
  });

  it("dài tối đa 100 ký tự sau khi bỏ khoảng trắng hai đầu", () => {
    expect(validateName("x".repeat(CATALOG_NAME_MAX))).toBeNull();
    expect(validateName(`  ${"x".repeat(CATALOG_NAME_MAX)}  `)).toBeNull();
    expect(validateName("x".repeat(CATALOG_NAME_MAX + 1))).toBe("tooLong");
  });

  it("tên hợp lệ", () => {
    expect(validateName("Sức khỏe")).toBeNull();
  });
});
