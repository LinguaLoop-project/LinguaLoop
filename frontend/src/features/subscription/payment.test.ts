import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addMonths,
  clearReturnTo,
  expectedEnd,
  failureReasonKey,
  lowestMonthlyPriceVnd,
  peekReturnTo,
  rememberReturnTo,
  savingsPercent,
  vnpayParams,
} from "./payment";
import type { SalePlan } from "./types";

const plan = (months: number, priceVnd: number): SalePlan => ({
  id: `p${months}-${priceVnd}`,
  name: `${months} tháng`,
  months,
  priceVnd,
  creditsPerMonth: 500,
});

describe("expectedEnd", () => {
  const now = new Date(2026, 10, 10, 9, 0);

  it("upgrade starts today (AC-PR-06)", () => {
    expect(expectedEnd("upgrade", 1, now, null)).toEqual(new Date(2026, 11, 10, 9, 0));
    expect(expectedEnd("upgrade", 12, now, null)).toEqual(new Date(2027, 10, 10, 9, 0));
  });

  it("renew chains onto the current end (AC-PR-19)", () => {
    const end = new Date(2026, 10, 20, 9, 0).toISOString();
    expect(expectedEnd("renew", 1, now, end)).toEqual(new Date(2026, 11, 20, 9, 0));
  });

  it("renew after the current end has passed counts from today", () => {
    const end = new Date(2026, 10, 1).toISOString();
    expect(expectedEnd("renew", 1, now, end)).toEqual(new Date(2026, 11, 10, 9, 0));
  });
});

describe("addMonths", () => {
  it("clamps to the last day of a shorter month", () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    expect(addMonths(new Date(2026, 11, 31), 2)).toEqual(new Date(2027, 1, 28));
  });
});

describe("savingsPercent", () => {
  const plans = [plan(1, 99_000), plan(3, 249_000), plan(12, 990_000), plan(6, 700_000)];

  it("compares with buying the cheapest monthly plan", () => {
    expect(savingsPercent(plans[1], plans)).toBe(16);
    expect(savingsPercent(plans[2], plans)).toBe(17);
  });

  it("has no saving for the monthly plan, a pricier plan, or without a monthly plan", () => {
    expect(savingsPercent(plans[0], plans)).toBeNull();
    expect(savingsPercent(plans[3], plans)).toBeNull();
    expect(savingsPercent(plans[2], [plans[2]])).toBeNull();
  });
});

describe("lowestMonthlyPriceVnd", () => {
  it("picks the lowest monthly-equivalent price across available plans", () => {
    const plans = [plan(1, 5_000), plan(3, 249_000), plan(12, 399_000)];
    expect(lowestMonthlyPriceVnd(plans)).toBe(5_000);
    expect(lowestMonthlyPriceVnd([plan(1, 99_000), plan(12, 399_000)])).toBe(33_250);
    expect(lowestMonthlyPriceVnd([])).toBeNull();
  });

  it("ignores free (0 VND) plans so the sidebar never advertises 0 VND", () => {
    expect(lowestMonthlyPriceVnd([plan(1, 0), plan(12, 399_000)])).toBe(33_250);
    expect(lowestMonthlyPriceVnd([plan(1, 0)])).toBeNull();
  });
});

describe("failureReasonKey", () => {
  it("uses a specific reason for known VNPAY codes and a generic one otherwise", () => {
    expect(failureReasonKey("51")).toBe("51");
    expect(failureReasonKey("13")).toBe("13");
    expect(failureReasonKey("02")).toBe("other");
    expect(failureReasonKey(null)).toBe("other");
  });
});

describe("vnpayParams", () => {
  it("keeps only vnp_ params with decoded values", () => {
    expect(vnpayParams("?vnp_Amount=9900000&vnp_OrderInfo=Thanh+toan+goi&utm=x")).toEqual({
      vnp_Amount: "9900000",
      vnp_OrderInfo: "Thanh toan goi",
    });
  });
});

describe("returnTo", () => {
  // Test chạy trong môi trường node: giả lập sessionStorage bằng Map
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is kept until cleared", () => {
    rememberReturnTo("/student/vocab/abc");
    expect(peekReturnTo()).toBe("/student/vocab/abc");
    expect(peekReturnTo()).toBe("/student/vocab/abc");
    clearReturnTo();
    expect(peekReturnTo()).toBeNull();
  });

  it("ignores paths that leave the app", () => {
    rememberReturnTo("//evil.example");
    expect(peekReturnTo()).toBeNull();
  });
});
