import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf-8");

/** Mức tô màu tối đa của nền toàn ứng dụng (tối, sáng) để chữ phụ đặt thẳng lên nền vẫn đọc được. */
const MAX_TINT = { dark: 12, light: 8 } as const;

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pha `color` vào `base` theo `percent`% như `color-mix(in srgb, color percent%, base)`. */
function tint(color: string, base: string, percent: number): string {
  const [c, b] = [channels(color), channels(base)];
  const mixed = c.map((value, i) => Math.round((value * percent) / 100 + b[i] * (1 - percent / 100)));
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function readVars(body: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [, key, value] of body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) vars[key] = value;
  return vars;
}

type Palette = { name: string; theme: "dark" | "light"; vars: Record<string, string> };

/** Biến màu của từng bảng màu theo chế độ, đọc thẳng từ `index.css` (tím là khối gốc, 5 bảng còn lại có khối riêng). */
function palettes(): Palette[] {
  const found: Palette[] = [];
  const dark = css.match(/:root,\s*:root\[data-theme="dark"\]\s*\{([^}]*)\}/);
  const light = css.match(/:root\[data-theme="light"\]\s*\{([^}]*)\}/);
  if (dark) found.push({ name: "violet dark", theme: "dark", vars: readVars(dark[1]) });
  if (light) found.push({ name: "violet light", theme: "light", vars: readVars(light[1]) });
  for (const [, theme, accent, body] of css.matchAll(/:root\[data-theme="(\w+)"\]\[data-accent="(\w+)"\]\s*\{([^}]*)\}/g)) {
    found.push({ name: `${accent} ${theme}`, theme: theme as "dark" | "light", vars: readVars(body) });
  }
  return found;
}

describe("bảng màu nhấn đạt tương phản chữ 4,5 (AC-TK-70)", () => {
  const all = palettes();

  it("đọc được đủ 6 bảng màu ở cả hai chế độ", () => {
    expect(all).toHaveLength(12);
  });

  it.each(all)("$name: chữ phụ và chữ trên nút đủ đọc", ({ vars }) => {
    expect(contrast(vars["text-muted"], vars.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vars["text-subtle"], vars.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vars["primary-text"], vars.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#FFFFFF", vars["btn-primary"])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(all)("$name: chữ phụ đặt thẳng lên nền có vệt màu vẫn đủ đọc", ({ theme, vars }) => {
    const base = vars["bg-base"];
    for (const color of ["primary", "accent", "accent-2"]) {
      const background = tint(vars[color], base, MAX_TINT[theme]);
      expect(contrast(vars["text-muted"], background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(vars["text-subtle"], background)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(vars["text-subtle"], base)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("nền giao diện không tô quá mức cho phép (AC-TK-70)", () => {
  const blocks = [...css.matchAll(/:root\[data-learn-bg="(gradient|aurora)"\]\[data-theme="(dark|light)"\] body \{([^}]*)\}/g)];

  it("có đủ khối chuyển sắc và cực quang cho cả hai chế độ", () => {
    expect(blocks).toHaveLength(4);
  });

  it.each(blocks.map(([, name, theme, body]) => ({ name, theme: theme as "dark" | "light", body })))(
    "$name $theme: mọi lớp màu tô không quá mức tối đa",
    ({ theme, body }) => {
      const percents = [...body.matchAll(/color-mix\(in srgb, var\(--[\w-]+\) (\d+)%/g)].map((m) => Number(m[1]));
      expect(percents.length).toBeGreaterThan(0);
      for (const percent of percents) expect(percent).toBeLessThanOrEqual(MAX_TINT[theme]);
    },
  );

  it("cực quang dùng background-attachment: fixed cho mọi lớp gradient", () => {
    for (const [, name, , body] of blocks) {
      if (name === "aurora") expect(body).toContain("background-attachment: fixed");
    }
  });
});
