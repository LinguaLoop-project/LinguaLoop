import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en/pages.json";
import vi from "@/i18n/locales/vi/pages.json";

/** Đường dẫn khoá lá; bỏ hậu tố số nhiều (_one, _other) vì tiếng Việt không chia số nhiều. */
function leafPaths(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix.replace(/_(one|other)$/, "")];
  return Object.entries(node).flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key));
}

describe("chuỗi giao diện Shadowing: công cụ câu, lịch sử, danh sách và phím tắt", () => {
  for (const section of ["tools", "history", "list", "shortcuts"] as const) {
    it(`tiếng Việt và tiếng Anh có cùng bộ khoá ở "${section}"`, () => {
      const viKeys = [...new Set(leafPaths(vi.student.shadowingPractice[section]))].sort();
      const enKeys = [...new Set(leafPaths(en.student.shadowingPractice[section]))].sort();
      expect(enKeys).toEqual(viKeys);
    });
  }
});
