package com.lingualoop.backend.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Hồ sơ học tập (UC-TK-08). Mức thời lượng, ngôn ngữ, múi giờ và điều khoản kiểm ở service vì phụ thuộc trạng thái
 * tài khoản; ở đây chỉ chặn dữ liệu thiếu hoặc quá dài.
 */
public record LearningProfileRequest(
        @NotBlank @Size(max = 50) String displayName,
        @NotNull Integer dailyMinutes,
        @NotBlank String uiLanguage,
        @NotBlank String timezone,
        boolean acceptTerms) {

    public LearningProfileRequest {
        displayName = displayName == null ? null : displayName.trim();
    }
}
