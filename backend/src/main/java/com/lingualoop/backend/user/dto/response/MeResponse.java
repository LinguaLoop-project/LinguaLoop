package com.lingualoop.backend.user.dto.response;

import java.util.UUID;

/** Hồ sơ của người đang đăng nhập; {@code role} là giá trị DB ({@code student|teacher|admin}). */
public record MeResponse(
        UUID id,
        String email,
        String displayName,
        String avatarUrl,
        String role,
        boolean emailVerified,
        boolean onboarded,
        boolean hasPassword,
        boolean googleLinked,
        int dailyMinutes,
        String uiLanguage,
        String timezone,
        boolean termsAccepted,
        /** true khi học viên đã tự tải ảnh đại diện lên (khác ảnh Google); dùng để hiện nút "Gỡ ảnh". */
        boolean customAvatar) {
}
