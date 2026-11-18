import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en/vocab.json";
import vi from "@/i18n/locales/vi/vocab.json";

/** Đường dẫn khoá lá; bỏ hậu tố số nhiều (_one, _other) vì tiếng Việt không chia số nhiều. */
function leafPaths(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix.replace(/_(one|other)$/, "")];
  return Object.entries(node).flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key));
}

/** Giá trị tại `path`; khoá số nhiều chỉ có `_other` thì lấy bản đó. */
function lookup(tree: unknown, path: string): unknown {
  const walk = (node: unknown, parts: string[]): unknown => {
    if (parts.length === 0) return node;
    if (typeof node !== "object" || node === null) return undefined;
    const record = node as Record<string, unknown>;
    const [head, ...rest] = parts;
    if (rest.length === 0 && !(head in record) && `${head}_other` in record) return record[`${head}_other`];
    return walk(record[head], rest);
  };
  return walk(tree, path.split("."));
}

// Mã nguồn của "Bộ của tôi", đọc dạng chữ để dò các lời gọi t("khoá tĩnh")
const sources = import.meta.glob(["./components/mine/*.tsx"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;

describe("chuỗi giao diện của Bộ của tôi (UC-HT-08)", () => {
  it("tiếng Việt và tiếng Anh có cùng bộ khoá", () => {
    expect([...new Set(leafPaths(en.mine))].sort()).toEqual([...new Set(leafPaths(vi.mine))].sort());
  });

  it("mọi khoá mine.* được dùng trong code đều trỏ tới một chuỗi, ở cả hai ngôn ngữ", () => {
    const used = new Set<string>();
    for (const code of Object.values(sources)) {
      for (const match of code.matchAll(/\bt\(\s*"(mine\.[\w.]+)"/g)) used.add(match[1]);
    }
    expect(used.size).toBeGreaterThan(15);
    const bad = [...used].filter((key) => typeof lookup(vi, key) !== "string" || typeof lookup(en, key) !== "string");
    expect(bad).toEqual([]);
  });

  it("các lỗi tên dùng đúng mã server trả (NotBlank, Size) cùng mã Duplicate cho tên trùng", () => {
    expect(Object.keys(vi.mine.dialog.errors).sort()).toEqual(["Duplicate", "NotBlank", "Size"]);
    expect(Object.keys(en.mine.dialog.errors).sort()).toEqual(["Duplicate", "NotBlank", "Size"]);
  });
});
