import type { CreditBalance } from "../features/subscription/types";
import { CREDIT_MIN_TO_START, FREE_DAILY_CREDITS, TUTOR_SESSION_COST } from "../features/subscription/types";

/** Credit Free mỗi ngày, dùng để hiển thị khi chưa tải xong số dư (BR-GA). */
export const DEFAULT_FREE_AI_ENERGY = FREE_DAILY_CREDITS;

export interface EnergyView {
  energyUsed: number;
  /** null với Pro và tài khoản nhân viên: credit theo gói, không hiện hạn mức ngày. */
  energyLimit: number | null;
  /** Số dư hiện tại; null với Pro và nhân viên để giao diện không hiện chip đếm. */
  remaining: number | null;
  /** Số phiên gia sư tối đa một ngày của gói Free; null với Pro. */
  tutorSessionsPerDay: number | null;
  /** Không đủ số dư tối thiểu để mở phiên gia sư. */
  tutorOut: boolean;
}

/** Số liệu credit AI hiển thị từ số dư của server; chưa có số liệu thì dùng mức Free mặc định. */
export function deriveEnergy(isPro: boolean, credit: CreditBalance | undefined): EnergyView {
  const balance = credit?.balance ?? (isPro ? null : DEFAULT_FREE_AI_ENERGY);
  const energyLimit = isPro ? null : DEFAULT_FREE_AI_ENERGY;
  const remaining = isPro ? null : balance;
  return {
    energyUsed: energyLimit !== null && remaining !== null ? Math.max(energyLimit - remaining, 0) : 0,
    energyLimit,
    remaining,
    tutorSessionsPerDay: energyLimit !== null ? Math.floor(energyLimit / TUTOR_SESSION_COST) : null,
    tutorOut: balance !== null && balance < CREDIT_MIN_TO_START,
  };
}
