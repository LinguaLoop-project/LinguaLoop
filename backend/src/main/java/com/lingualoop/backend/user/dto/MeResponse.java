package com.lingualoop.backend.user.dto;

import java.util.UUID;

/** Hồ sơ của người đang đăng nhập; {@code role} là giá trị DB ({@code student|instructor|admin}). */
public record MeResponse(
        UUID id,
        String email,
        String displayName,
        String avatarUrl,
        String role,
        boolean emailVerified,
        boolean onboarded,
        boolean hasPassword,
        boolean googleLinked) {
}
