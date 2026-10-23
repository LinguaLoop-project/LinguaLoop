import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en/dictation.json";
import vi from "@/i18n/locales/vi/dictation.json";

/** Đường dẫn khoá lá; bỏ hậu tố số nhiều (_one, _other) vì tiếng Việt không chia số nhiều. */
function leafPaths(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix.replace(/_(one|other)$/, "")];
  return Object.entries(node).flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key));
}

describe("chuỗi giao diện nghe chép", () => {
  it("tiếng Việt và tiếng Anh có cùng bộ khoá", () => {
    expect([...new Set(leafPaths(en))].sort()).toEqual([...new Set(leafPaths(vi))].sort());
  });
});
