import type { FeatureUsage } from "../features/subscription/types";
import { AI_ACTION_TUTOR } from "../features/subscription/types";

/** Năng lượng Free mỗi ngày, chỉ để hiển thị khi chưa tải xong hạn mức từ server (BR-QUOTA-01). */
export const DEFAULT_FREE_AI_ENERGY = 8;

export interface EnergyView {
  energyUsed: number;
  /** null: không giới hạn (Pro). */
  energyLimit: number | null;
  /** null: không giới hạn (Pro). */
  remaining: number | null;
  /** Số phiên gia sư tối đa một ngày của gói Free; null khi chưa biết giá hoặc Pro. */
  tutorSessionsPerDay: number | null;
  /** Free không đủ năng lượng cho một phiên gia sư. */
  tutorOut: boolean;
}

/** Số liệu năng lượng AI hiển thị từ mức dùng và bảng giá của server; chưa có số liệu thì dùng mức Free mặc định. */
export function deriveEnergy(
  isPro: boolean,
  usage: FeatureUsage | undefined,
  costs: Record<string, number>,
): EnergyView {
  const energyUsed = usage?.used ?? 0;
  const energyLimit = isPro ? null : (usage?.limit ?? DEFAULT_FREE_AI_ENERGY);
  const remaining = isPro ? null : (usage?.remaining ?? Math.max(DEFAULT_FREE_AI_ENERGY - energyUsed, 0));
  const tutorCost = costs[AI_ACTION_TUTOR];
  return {
    energyUsed,
    energyLimit,
    remaining,
    tutorSessionsPerDay: energyLimit !== null && tutorCost ? Math.floor(energyLimit / tutorCost) : null,
    tutorOut: remaining !== null && tutorCost !== undefined && remaining < tutorCost,
  };
}
