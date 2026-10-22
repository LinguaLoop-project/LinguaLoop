import { describe, expect, it } from "vitest";
import type { FeatureUsage } from "../features/subscription/types";
import { DEFAULT_FREE_AI_ENERGY, deriveEnergy } from "./aiEnergyMath";

const COSTS = { ai_feedback: 1, tutor_session: 3 };
const usage = (used: number, limit: number | null = 8): FeatureUsage => ({
  feature: "ai_energy",
  period: "day",
  limit,
  used,
  remaining: limit === null ? null : Math.max(limit - used, 0),
});

describe("deriveEnergy", () => {
  it("Free chưa có số liệu thì hiện mức mặc định, chưa biết giá thì không khoá gia sư", () => {
    const v = deriveEnergy(false, undefined, {});
    expect(v).toMatchObject({ energyLimit: DEFAULT_FREE_AI_ENERGY, remaining: DEFAULT_FREE_AI_ENERGY, tutorOut: false });
    expect(v.tutorSessionsPerDay).toBeNull();
  });

  it("Free còn 2 năng lượng thì không đủ một phiên gia sư (giá 3), còn 3 thì đủ", () => {
    expect(deriveEnergy(false, usage(6), COSTS).tutorOut).toBe(true);
    expect(deriveEnergy(false, usage(5), COSTS).tutorOut).toBe(false);
  });

  it("số phiên gia sư tối đa mỗi ngày là phần nguyên của hạn mức chia giá", () => {
    expect(deriveEnergy(false, usage(0), COSTS).tutorSessionsPerDay).toBe(2);
  });

  it("Pro không giới hạn: không có hạn mức, không khoá gia sư", () => {
    const v = deriveEnergy(true, usage(40, null), COSTS);
    expect(v).toMatchObject({ energyLimit: null, remaining: null, tutorOut: false, tutorSessionsPerDay: null });
  });
});
