import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf-8");

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Biến màu của từng bảng màu nhấn theo chế độ, đọc thẳng từ `index.css`. */
function palettes() {
  const found: { name: string; vars: Record<string, string> }[] = [];
  for (const [, theme, accent, body] of css.matchAll(/:root\[data-theme="(\w+)"\]\[data-accent="(\w+)"\]\s*\{([^}]*)\}/g)) {
    const vars: Record<string, string> = {};
    for (const [, key, value] of body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) vars[key] = value;
    found.push({ name: `${accent} ${theme}`, vars });
  }
  return found;
}

describe("bảng màu nhấn đạt tương phản chữ 4,5 (AC-TK-70)", () => {
  const all = palettes();

  it("đọc được đủ 5 bảng màu nhấn khác tím ở cả hai chế độ", () => {
    expect(all).toHaveLength(10);
  });

  it.each(all)("$name: chữ phụ và chữ trên nút đủ đọc", ({ vars }) => {
    expect(contrast(vars["text-muted"], vars.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vars["text-subtle"], vars.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vars["primary-text"], vars.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#FFFFFF", vars["btn-primary"])).toBeGreaterThanOrEqual(4.5);
  });
});
