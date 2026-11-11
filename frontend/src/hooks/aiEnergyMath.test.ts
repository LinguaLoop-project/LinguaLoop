import { describe, expect, it } from "vitest";
import type { CreditBalance } from "../features/subscription/types";
import { DEFAULT_FREE_AI_ENERGY, deriveEnergy } from "./aiEnergyMath";

const free = (balance: number): CreditBalance => ({ balance, resetsAt: "2026-11-11T17:00:00Z", kind: "free" });

describe("deriveEnergy", () => {
  it("Free chưa có số liệu thì hiện mức mặc định và không khoá gia sư", () => {
    const v = deriveEnergy(false, undefined);
    expect(v).toMatchObject({ energyLimit: DEFAULT_FREE_AI_ENERGY, remaining: DEFAULT_FREE_AI_ENERGY, tutorOut: false });
  });

  it("dưới số dư tối thiểu 5 thì không mở được phiên gia sư, đủ 5 thì được", () => {
    expect(deriveEnergy(false, free(4)).tutorOut).toBe(true);
    expect(deriveEnergy(false, free(5)).tutorOut).toBe(false);
  });

  it("số phiên gia sư tối đa mỗi ngày là phần nguyên của 20 credit chia giá 3", () => {
    expect(deriveEnergy(false, free(20)).tutorSessionsPerDay).toBe(6);
    expect(deriveEnergy(false, free(12)).energyUsed).toBe(8);
  });

  it("Pro không hiện hạn mức ngày nhưng vẫn khoá gia sư khi hết credit của tháng", () => {
    const pro: CreditBalance = { balance: 2, resetsAt: null, kind: "pro" };
    expect(deriveEnergy(true, pro)).toMatchObject({ energyLimit: null, remaining: null, tutorOut: true, tutorSessionsPerDay: null });
    expect(deriveEnergy(true, { ...pro, balance: 300 }).tutorOut).toBe(false);
  });
});
