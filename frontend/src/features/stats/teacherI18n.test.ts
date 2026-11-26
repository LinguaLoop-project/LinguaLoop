import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en/statsTeacher.json";
import vi from "@/i18n/locales/vi/statsTeacher.json";

function leafPaths(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key));
}

function lookup(tree: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined), tree);
}

// Trang thống kê của giáo viên (namespace statsTeacher), đọc dạng chữ để dò các lời gọi t("khoá tĩnh").
const sources = Object.values(
  import.meta.glob(["./pages/teacher/*.tsx", "./components/TeacherStatsBits.tsx"], { query: "?raw", import: "default", eager: true }),
) as string[];

describe("chuỗi giao diện của thống kê giáo viên (UC-TN-01 đến 03)", () => {
  it("tiếng Việt và tiếng Anh có cùng bộ khoá", () => {
    expect(leafPaths(en).sort()).toEqual(leafPaths(vi).sort());
  });

  it("mọi khoá tĩnh và khoá ghép động đều có ở cả hai ngôn ngữ", () => {
    const used = new Set<string>();
    for (const code of sources) {
      for (const match of code.matchAll(/\bt\(\s*"([A-Za-z][\w.]*)"/g)) used.add(match[1]);
    }
    const dynamic = [
      ...["draft", "published"].map((k) => `status.${k}`),
      ...["dictation", "shadowing", "review"].map((k) => `overview.series.${k}`),
      ...["dictation", "shadowing"].map((k) => `lesson.series.${k}`),
      ...["reviews", "correct"].map((k) => `deck.series.${k}`),
      ...["new", "learning", "reviewing", "mastered"].map((k) => `deck.state.${k}`),
    ];
    expect(used.size).toBeGreaterThan(30);
    const bad = [...used, ...dynamic].filter((key) => typeof lookup(vi, key) !== "string" || typeof lookup(en, key) !== "string");
    expect(bad).toEqual([]);
  });
});
