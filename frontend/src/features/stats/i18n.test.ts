import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en/stats.json";
import vi from "@/i18n/locales/vi/stats.json";

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

// Mọi file nguồn của feature, đọc dạng chữ để dò các lời gọi t("khoá tĩnh"); bỏ file trang quản trị (namespace statsAdmin)
const allSources = import.meta.glob(["./**/*.ts", "./**/*.tsx", "!./**/*.test.ts"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const sources = Object.values(allSources).filter((code) => !code.includes('useTranslation("statsAdmin")'));

describe("chuỗi giao diện của thống kê học tập", () => {
  it("tiếng Việt và tiếng Anh có cùng bộ khoá", () => {
    expect([...new Set(leafPaths(en))].sort()).toEqual([...new Set(leafPaths(vi))].sort());
  });

  it("mọi khoá tĩnh được dùng trong code đều trỏ tới một chuỗi, ở cả hai ngôn ngữ", () => {
    const used = new Set<string>();
    for (const code of sources) {
      for (const match of code.matchAll(/\bt\(\s*"([A-Za-z][\w.]*)"/g)) used.add(match[1]);
    }
    expect(used.size).toBeGreaterThan(30);
    const bad = [...used].filter((key) => typeof lookup(vi, key) !== "string" || typeof lookup(en, key) !== "string");
    expect(bad).toEqual([]);
  });

  it("khoá ghép động (khoảng, chế độ, nhóm từ, nguyên nhân, loại lượt, thứ trong tuần) đều có đủ ở cả hai ngôn ngữ", () => {
    const dynamic = [
      ...["7d", "30d", "all"].map((k) => `range.${k}`),
      ...["all", "dictation", "shadowing", "vocab", "ai"].map((k) => `history.mode.${k}`),
      ...["normal", "retry", "gave_up"].map((k) => `history.attemptKind.${k}`),
      ...["function", "content", "inflected", "number", "proper", "other"].map((k) => `weakness.dictation.class.${k}`),
      ...["omitted", "substituted", "misspelled"].map((k) => `weakness.dictation.cause.${k}`),
      ...["good", "attention", "bad", "insufficient"].map((k) => `weakness.map.legend.${k}`),
      ...["new", "learning", "reviewing", "mastered"].map((k) => `cards.${k}`),
      ...["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((k) => `streak.weekdays.${k}`),
      ...["function", "content", "inflected", "number", "proper", "other"].flatMap((k) => [
        `weakness.dictation.help.${k}.desc`,
        `weakness.dictation.help.${k}.examples`,
      ]),
    ];
    const bad = dynamic.filter((key) => typeof lookup(vi, key) !== "string" || typeof lookup(en, key) !== "string");
    expect(bad).toEqual([]);
  });
});
