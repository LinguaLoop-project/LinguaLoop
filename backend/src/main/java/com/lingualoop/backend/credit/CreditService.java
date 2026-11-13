package com.lingualoop.backend.credit;

import java.util.UUID;

import com.lingualoop.backend.credit.dto.CreditBalance;

/** Hợp đồng credit AI cho các feature dùng AI (shadowing, tutor, ...). */
public interface CreditService {

    /**
     * Làm mới ví theo gói (lazy) rồi kiểm số dư &gt;= {@code ai_settings.min_balance_to_start}. Không đủ thì ghi
     * {@code rejected_no_credit} vào {@code ai_usage_logs}.
     *
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code QUOTA_EXCEEDED}
     *         (details: feature, balance, minBalance)
     */
    void requireCanStart(UUID userId, AiFeature feature);

    /**
     * Trừ {@code ceil((in*priceIn + out*priceOut) / 1e6 / creditValueVnd)}, tối thiểu 1, không để ví âm (BR-GA-06);
     * ghi {@code ai_usage_logs} success.
     *
     * @return số credit đã trừ thật (có thể nhỏ hơn chi phí tính được khi ví không đủ)
     */
    int charge(UUID userId, AiFeature feature, long inputUnits, long outputUnits);

    /** Trừ đúng {@code credits} (phiên gia sư, chi phí cố định); cùng quy tắc không âm. Trả số credit đã trừ. */
    int chargeFixed(UUID userId, AiFeature feature, int credits);

    /** Ghi {@code ai_usage_logs} failed hoặc rejected_no_credit, không trừ credit. */
    void logFailure(UUID userId, AiFeature feature, boolean rejectedNoCredit);

    CreditBalance balanceOf(UUID userId);
}
