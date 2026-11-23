package com.lingualoop.backend.credit.service;

import java.util.UUID;

import com.lingualoop.backend.credit.dto.CreditConfigView;
import com.lingualoop.backend.credit.dto.UpdateCreditConfigRequest;

/** Xem và sửa cấu hình credit (UC-GA-01, UC-GA-02). Chỉ quản trị viên. */
public interface AdminCreditConfigService {

    CreditConfigView get();

    /**
     * Lưu cấu hình mới và ghi nhật ký giá trị cũ, mới (BR-GA-09). Lỗi: {@code CREDIT_CONFIG_STALE} khi người khác vừa
     * sửa (8b), {@code CREDIT_CONFIG_UNCHANGED} khi không có thay đổi (4b), {@code CREDIT_CONFIG_FEE_MARGIN_TOO_HIGH}
     * khi tổng phí cổng và biên tối thiểu từ 100% (5b).
     */
    CreditConfigView update(UUID adminId, UpdateCreditConfigRequest request);
}
