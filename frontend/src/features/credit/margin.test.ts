import { describe, expect, it } from "vitest";
import { parseIntIn, parsePercent, planMargin } from "./margin";

const settings = { creditValueVnd: 25, gatewayFeePct: 3, marginPct: 40 };

describe("planMargin", () => {
  it("tính biên khi dùng hết theo ví dụ của BR-GA-05 (AC-GA-17, 18)", () => {
    expect(planMargin({ months: 1, priceVnd: 50_000, creditsPerMonth: 1000 }, settings)).toEqual({
      kind: "margin",
      pct: 48.5,
      low: false,
    });
    expect(planMargin({ months: 3, priceVnd: 129_000, creditsPerMonth: 1000 }, settings)).toMatchObject({ pct: 40.1, low: false });
    expect(planMargin({ months: 12, priceVnd: 500_000, creditsPerMonth: 1000 }, settings)).toMatchObject({ pct: 38.1, low: true });
  });

  it("tính lại theo giá trị 1 credit mới và giá gói mới (AC-GA-13, 23)", () => {
    expect(planMargin({ months: 1, priceVnd: 50_000, creditsPerMonth: 1000 }, { ...settings, creditValueVnd: 26 })).toMatchObject({ pct: 46.4 });
    expect(planMargin({ months: 1, priceVnd: 60_000, creditsPerMonth: 1000 }, settings)).toMatchObject({ pct: 57, low: false });
  });

  it("gói 0 đồng chỉ nêu chi phí tối đa mỗi tháng (AC-GA-42)", () => {
    expect(planMargin({ months: 1, priceVnd: 0, creditsPerMonth: 100 }, settings)).toEqual({ kind: "free", maxCostVnd: 2500 });
  });
});

describe("parse", () => {
  it("số nguyên trong khoảng, trống hoặc chữ là sai (AC-GA-08)", () => {
    expect(parseIntIn("25", 1, 1000)).toBe(25);
    expect(parseIntIn("0", 1, 1000)).toBeNull();
    expect(parseIntIn("abc", 1, 1000)).toBeNull();
    expect(parseIntIn("", 1, 1000)).toBeNull();
  });

  it("phần trăm tối đa 1 chữ số thập phân", () => {
    expect(parsePercent("3")).toBe(3);
    expect(parsePercent("2,5")).toBe(2.5);
    expect(parsePercent("2,55")).toBeNull();
    expect(parsePercent("100")).toBeNull();
  });
});
