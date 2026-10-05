package com.lingualoop.backend.user.dto;

import java.util.UUID;

import com.lingualoop.backend.security.Role;

/**
 * Bản chụp tài khoản cho feature {@code auth}, không lộ entity ra ngoài feature {@code user}.
 * Có {@code passwordHash} để auth so khớp mật khẩu; không được đưa thẳng ra response.
 */
public record UserAccount(
        UUID id,
        String email,
        String displayName,
        String avatarUrl,
        String passwordHash,
        Role role,
        String uiLanguage,
        boolean emailVerified,
        boolean disabled,
        boolean onboarded,
        boolean googleLinked) {

    public boolean hasPassword() {
        return passwordHash != null;
    }

    public MeResponse toMe() {
        return new MeResponse(id, email, displayName, avatarUrl, role.value(), emailVerified, onboarded,
                hasPassword(), googleLinked);
    }
}
