import type { AiAction } from "@/features/subscription/types";

/** Một hàng của bảng dịch vụ tính credit (BR-GA-04). */
export interface CreditFeatureRow {
  feature: AiAction;
  creditsPerUse: number;
  inputPriceVnd: number;
  outputPriceVnd: number;
  fixedCostVnd: number;
}

/** Cấu hình credit (`GET /admin/credit-config`, UC-GA-01). `updatedBy` null = chưa từng được sửa. */
export interface CreditConfig {
  creditValueVnd: number;
  gatewayFeePct: number;
  marginPct: number;
  trialCredits: number;
  features: CreditFeatureRow[];
  updatedBy: { id: string; displayName: string | null } | null;
  updatedAt: string | null;
  /** Gửi lại khi lưu để phát hiện người khác vừa sửa (UC-GA-02 8b). */
  version: string;
}

export type UpdateCreditConfigInput = Omit<CreditConfig, "updatedBy" | "updatedAt">;
