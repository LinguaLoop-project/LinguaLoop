import { describe, expect, it } from "vitest";
import type { CreditBalance } from "../features/subscription/types";
import { deriveEnergy } from "./aiEnergyMath";

const free = (balance: number): CreditBalance => ({ balance, resetsAt: null, kind: "free" });
const pro = (balance: number): CreditBalance => ({ balance, resetsAt: "2026-12-15T00:00:00Z", kind: "pro" });
const TUTOR = 3;

describe("deriveEnergy", () => {
  it("chưa tải xong số dư thì không hiện số và không khoá gia sư", () => {
    expect(deriveEnergy(undefined, TUTOR)).toEqual({ remaining: null, balance: null, resetsAt: null, tutorOut: false });
  });

  it("gói Free hiện credit dùng thử còn lại, không có ngày làm mới (BR-GA-03)", () => {
    expect(deriveEnergy(free(87), TUTOR)).toEqual({ remaining: 87, balance: 87, resetsAt: null, tutorOut: false });
  });

  it("gói Pro hiện số dư và ngày làm mới của tháng (BR-GA-10)", () => {
    expect(deriveEnergy(pro(940), TUTOR)).toMatchObject({ remaining: 940, resetsAt: "2026-12-15T00:00:00Z" });
  });

  it("số dư nhỏ hơn giá một phiên gia sư thì khoá, bằng giá thì được (BR-GA-06)", () => {
    expect(deriveEnergy(free(2), TUTOR).tutorOut).toBe(true);
    expect(deriveEnergy(free(3), TUTOR).tutorOut).toBe(false);
    expect(deriveEnergy(pro(2), TUTOR).tutorOut).toBe(true);
  });

  it("chưa tải xong giá thì không khoá gia sư", () => {
    expect(deriveEnergy(free(0)).tutorOut).toBe(false);
  });

  it("tài khoản nhân viên không hiện chip đếm của học viên nhưng vẫn có số dư để hiện credit soạn bài", () => {
    const view = deriveEnergy({ balance: 500, resetsAt: null, kind: "staff" }, TUTOR);
    expect(view.remaining).toBeNull();
    expect(view.balance).toBe(500);
  });
});
