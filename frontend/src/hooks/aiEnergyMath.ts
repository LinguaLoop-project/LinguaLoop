import type { CreditBalance } from "../features/subscription/types";

export interface EnergyView {
  /** Số dư credit hiện tại của học viên; null khi chưa tải xong hoặc với tài khoản nhân viên (không hiện chip đếm). */
  remaining: number | null;
  /** Số dư credit của mọi vai trò, gồm credit soạn bài của giáo viên (BR-GA-11); null khi chưa tải xong. */
  balance: number | null;
  /** Mốc làm mới credit tháng của gói Pro; null với credit dùng thử của gói Free (không làm mới, BR-GA-03). */
  resetsAt: string | null;
  /** Số dư nhỏ hơn giá một phiên gia sư nên không mở được phiên (BR-GA-06). */
  tutorOut: boolean;
}

/**
 * Số liệu credit AI hiển thị từ số dư của server. `tutorPrice` là credit một phiên gia sư (`GET /credits/prices`);
 * chưa tải xong số dư hoặc giá thì không khoá gia sư, server vẫn kiểm tra khi bấm.
 */
export function deriveEnergy(credit: CreditBalance | undefined, tutorPrice?: number): EnergyView {
  const learner = credit !== undefined && credit.kind !== "staff";
  return {
    remaining: learner ? credit.balance : null,
    balance: credit?.balance ?? null,
    resetsAt: credit?.kind === "pro" ? credit.resetsAt : null,
    tutorOut: credit !== undefined && tutorPrice !== undefined && credit.balance < tutorPrice,
  };
}
